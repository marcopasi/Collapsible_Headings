import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ICommandPalette } from '@jupyterlab/apputils';

import { Notebook, INotebookTracker, NotebookActions } from '@jupyterlab/notebook';

import { Cell } from '@jupyterlab/cells';

//import { ElementExt } from '@phosphor/domutils';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { findIndex } from '@lumino/algorithm';

const plugin: JupyterFrontEndPlugin<void> = {
  activate,
  requires: [INotebookTracker, ICommandPalette, ISettingRegistry],
  id: '@aquirdturtle/collapsible_headings:plugin',
  autoStart: true
};


function debugLog(message?: any, ...optionalParams: any[]) {
  // a simple wrapper which makes it very easy to turn logging off.
  if (false) {
    console.log(message, optionalParams);
  }
}


function activate(
  app: JupyterFrontEnd,
  nbTrack: INotebookTracker,
  palette: ICommandPalette,
  settings: ISettingRegistry
){
  console.log('JupyterLab extension @aquirdturtle/collapsible_headings is activated!!');

  settings.load(plugin.id).then(resSettings => debugLog('LOAD SETTINGS: ', resSettings));
  
  const uncollapseHeaderCmd:      string = 'Collapsible_Headings:Uncollapse_Header';
  const collapseCmd:              string = 'Collapsible_Headings:Collapse_Header';

  app.commands.addCommand(uncollapseHeaderCmd,    { label: 'Un-Collapse Header', execute: () => { uncollapseCell(nbTrack); } });
  app.commands.addCommand(collapseCmd,            { label: 'Collapse Header', execute: () => { collapseCell(nbTrack); }});

  palette.addItem({command:uncollapseHeaderCmd,     category: 'Collapsible Headings Extension'});
  palette.addItem({command:collapseCmd,             category: 'Collapsible Headings Extension'});

};


/* Slightly modified from NotebookActions to return number */
function findNearestParentHeader(cell: Cell | null, notebook: Notebook) : number {
    if(cell === null) {
        return -1;
    }
    const index = findIndex(notebook.widgets, (possibleCell, index) => {
        return cell.model.id === possibleCell.model.id;
    });
    if (index === -1) {
        debugLog("Index -1");
        return -1;
    }
    // Finds the nearest header above the given cell. If the cell is a header itself, it does not return itself;
    // this can be checked directly by calling functions.
    if (index >= notebook.widgets.length) {
        debugLog("Index too big");
        return -1;
    }
    let childHeaderInfo = NotebookActions.getHeadingInfo(notebook.widgets[index]);
    for (let cellN = index - 1; cellN >= 0; cellN--) {
        if (cellN < notebook.widgets.length) {
            let hInfo = NotebookActions.getHeadingInfo(notebook.widgets[cellN]);
            if (hInfo.isHeading &&
                hInfo.headingLevel < childHeaderInfo.headingLevel) {
                return cellN;
            }
        }
    }
    // else no parent header found.
    debugLog("None found for index", index);
    return -1;
}


function collapseCell(nbTrack: INotebookTracker) {
  if(nbTrack.currentWidget === null) { return; }
  let notebook = nbTrack.currentWidget.content;
  if(notebook.activeCell === null) { return; }

  let hInfo = NotebookActions.getHeadingInfo(notebook.activeCell);
  debugLog("Collapse ", hInfo);
  if (hInfo.isHeading && !hInfo.collapsed) {
    // Then Collapse!
    NotebookActions.setHeadingCollapse(
      notebook.activeCell,
      true,
      notebook
    );
  } else {
    debugLog("Jump to parent");
    // then jump to previous parent.
    let parentLoc = findNearestParentHeader(
      notebook.activeCell,
      notebook
    );
    debugLog("-- found ", parentLoc);
    if (parentLoc === undefined || parentLoc == -1) {
      // no parent, can't be collapsed so nothing to do.
      return;
    }
    notebook.activeCellIndex = parentLoc;
  }
  // ElementExt.scrollIntoViewIfNeeded(
  //   nbTrack.currentWidget.content.node,
  //   nbTrack.activeCell.node
  // );
}


function uncollapseCell(nbTrack: INotebookTracker) {
  if(nbTrack.currentWidget === null) { return; }
  let notebook = nbTrack.currentWidget.content;
  if(notebook.activeCell === null) { return; }

  if (NotebookActions.getHeadingInfo(notebook.activeCell).isHeading) {
    // Then uncollapse!
    NotebookActions.setHeadingCollapse(
      notebook.activeCell,
      false,
      notebook
    );
  } else {
    // then jump to next parent
    let parentLoc = NotebookActions.findNextParentHeading(
      notebook.activeCell,
      notebook
    );
    if (parentLoc === undefined || parentLoc == -1) {
      return;
    }
    notebook.activeCellIndex = parentLoc;
  }
  // ElementExt.scrollIntoViewIfNeeded(
  //   nbTrack.currentWidget.content.node,
  //   nbTrack.activeCell.node
  // );
}


export default plugin;
