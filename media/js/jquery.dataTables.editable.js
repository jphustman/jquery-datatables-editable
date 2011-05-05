 /*
* File:        jquery.dataTables.editable.js
* Version:     1.1.5.
* Author:      Jovan Popovic 
* 
* Copyright 2010-2011 Jovan Popovic, all rights reserved.
*
* This source file is free software, under either the GPL v2 license or a
* BSD style license, as supplied with this software.
* 
* This source file is distributed in the hope that it will be useful, but 
* WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY 
* or FITNESS FOR A PARTICULAR PURPOSE. 
* 
* Parameters:
* @sUpdateURL                   String      URL of the server-side page used for updating cell. Default value is "UpdateData".
* @sAddURL                      String      URL of the server-side page used for adding new row. Default value is "AddData".
* @sDeleteURL                   String      URL of the server-side page used to delete row by id. Default value is "DeleteData".
* @fnShowError                  Function    function(message, action){...}  used to show error message. Action value can be "update", "add" or "delete".
* @sAddNewRowFormId             String      Id of the form for adding new row. Default id is "formAddNewRow".
* @sAddNewRowButtonId           String      Id of the button for adding new row. Default id is "btnAddNewRow".
* @sAddNewRowOkButtonId         String      Id of the OK button placed in add new row dialog. Default value is "btnAddNewRowOk".
* @sAddNewRowCancelButtonId     String      Id of the OK button placed in add new row dialog. Default value is "btnAddNewRowCancel".
* @sDeleteRowButtonId           String      Id of the button for adding new row. Default id is "btnDeleteRow".
* @sSelectedRowClass            String      Class that will be associated to the selected row. Default class is "row_selected".
* @sReadOnlyCellClass           String      Class of the cells that should not be editable. Default value is "read_only".
* @sAddDeleteToolbarSelector    String      Selector used to identify place where add and delete buttons should be placed. Default value is ".add_delete_toolbar".
* @fnStartProcessingMode        Function    function(){...} called when AJAX call is started. Use this function to add "Please wait..." message  when some button is pressed.
* @fnEndProcessingMode          Function    function(){...} called when AJAX call is ended. Use this function to close "Please wait..." message.
* @aoColumns                    Array       Array of the JEditable settings that will be applied on the columns
* @sAddHttpMethod               String      Method used for the Add AJAX request (default is 'POST')
* @sDeleteHttpMethod            String      Method used for the Delete AJAX request (default is 'POST')
* @fnOnDeleting                 Function    function(tr, id){...} Function called before row is deleted.
                                            tr isJQuery object encapsulating row that will be deleted
                                            id is an id of the record that will be deleted.
                                            returns true if plugin should continue with deleting row, false will abort delete.
* @fnOnDeleted                  Function    function(status){...} Function called after delete action. Status can be "success" or "failure"
* @fnOnAdding                   Function    function(){...} Function called before row is added.
                                            returns true if plugin should continue with adding row, false will abort add.
* @fnOnAdded                    Function    function(status){...} Function called after delete action. Status can be "success" or "failure"
* @fnOnEditing                  Function    function(input){...} Function called before cell is updated.
                                            input JQuery object wrapping the inut element used for editing value in the cell.
                                            returns true if plugin should continue with sending AJAX request, false will abort update.
* @fnOnEdited                   Function    function(status){...} Function called after edit action. Status can be "success" or "failure"
*/
(function ($) {

    $.fn.makeEditable = function (options) {

    var iDisplayStart = 0;

    ///Utility function used to determine id of the cell
    //By default it is assumed that id is placed as an id attribute of <tr> that that surround the cell (<td> tag). E.g.:
    //<tr id="17">
    //  <td>...</td><td>...</td><td>...</td><td>...</td>
    //</tr>
    function fnGetCellID(cell) {
        return properties.fnGetRowID($(cell.parentNode));
    }

    ///Utility function used to set id of the new row
    //It is assumed that id is placed as an id attribute of <tr> that that surround the cell (<td> tag). E.g.:
    //<tr id="17">
    //  <td>...</td><td>...</td><td>...</td><td>...</td>
    //</tr>
    function _fnSetRowIDInAttribute(row, id) {
        row.attr("id", id);
    }

    //Utility function used to get id of the row
    //It is assumed that id is placed as an id attribute of <tr> that that surround the cell (<td> tag). E.g.:
    //<tr id="17">
    //  <td>...</td><td>...</td><td>...</td><td>...</td>
    //</tr>
    function _fnGetRowIDFromAttribute(row) {
        return row.attr("id");
    }

    //Utility function used to set id of the new row
    //It is assumed that id is placed as an id attribute of <tr> that that surround the cell (<td> tag). E.g.:
    //<tr>
    //  <td>17</td><td>...</td><td>...</td><td>...</td>
    //</tr>
    function _fnSetRowIDInFirstCell(row, id) {
        $("td:first", row).html(id);
    }

    //Utility function used to get id of the row
    //It is assumed that id is placed as an id attribute of <tr> that that surround the cell (<td> tag). E.g.:
    //<tr>
    //  <td>17</td><td>...</td><td>...</td><td>...</td>
    //</tr>
    function _fnGetRowIDFromFirstCell(row) {
        return $("td:first", row).html();
    }

    //Reference to the DataTable object
    var oTable;
    //Refences to the buttons used for manipulating table data
    var oAddNewRowButton, oDeleteRowButton, oConfirmRowAddingButton, oCancelRowAddingButton;
    //Reference to the form used for adding new data
    var oAddNewRowForm;

    //Plugin options
    var properties;

    /// Utility function that shows an error message
    ///@param errorText - text that should be shown
    ///@param action - action that was executed when error occured e.g. "update", "delete", or "add"
    function fnShowError(errorText, action) {
        alert(errorText);
    }

    //Utility function that put the table into the "Processing" state
    function fnStartProcessingMode() {
        if (oTable.fnSettings().oFeatures.bProcessing) {
            $(".dataTables_processing").css('visibility', 'visible');
        }
    }

    //Utility function that put the table in the normal state
    function fnEndProcessingMode() {
        if (oTable.fnSettings().oFeatures.bProcessing) {
            $(".dataTables_processing").css('visibility', 'hidden');
        }
    }

    var sOldValue, sNewCellValue, sNewCellDislayValue;
    //Utility function used to apply editable plugin on table cells
    function _fnApplyEditable(aoNodes) {
        var oDefaultEditableSettings = {
            event: 'dblclick',
            "callback": function (sValue, settings) {
                properties.fnEndProcessingMode();
                if (sNewCellValue == sValue) {
                    var aPos = oTable.fnGetPosition(this);
                    oTable.fnUpdate(sNewCellDisplayValue, aPos[0], aPos[2]);
                    properties.fnOnEdited("success");
                } else {
                    var aPos = oTable.fnGetPosition(this);
                    oTable.fnUpdate(sOldValue, aPos[0], aPos[2]);
                    properties.fnShowError(sValue, "update");
                    properties.fnOnEdited("failure");
                }
                _fnSetDisplayStart();

            },
            "onsubmit": function (settings, original) {
                var input = $("input,select,textarea", this);
                sOldValue = original.revert;
                sNewCellValue = $("input,select,textarea", $(this)).val();
                if (input.length == 1) {
                    var oEditElement = input[0];
                    if (oEditElement.nodeName.toLowerCase() == "select" || oEditElement.tagName.toLowerCase() == "select")
                        sNewCellDisplayValue = $("option:selected", oEditElement).text(); //For select list use selected text instead of value for displaying in table
                    else
                        sNewCellDisplayValue = sNewCellValue;
                }

                if (!properties.fnOnEditing(input))
                    return false;
                var x = settings;
                if (settings.cssclass != null) {
                    input.addClass(settings.cssclass);
                    if (!input.valid() || 0 == input.valid())
                        return false;
                    else
                        return true;
                }
            },
            "submitdata": function (value, settings) {
                iDisplayStart = _fnGetDisplayStart();
                properties.fnStartProcessingMode();
                var id = fnGetCellID(this);
                var rowId = oTable.fnGetPosition(this)[0];
                var columnPosition = oTable.fnGetPosition(this)[1];
                var columnId = oTable.fnGetPosition(this)[2];
                var sColumnName = oTable.fnSettings().aoColumns[columnId].sName;
                if (sColumnName == null || sColumnName == "")
                    sColumnName = oTable.fnSettings().aoColumns[columnId].sTitle;
                return {
                    "id": id,
                    "rowId": rowId,
                    "columnPosition": columnPosition,
                    "columnId": columnId,
                    "columnName": sColumnName
                };
            },
            "onerror": function () {
                properties.fnEndProcessingMode();
                properties.fnShowError("Cell cannot be updated(Server error)", "update");
                properties.fnOnEdited("failure");
            },
            "height": properties.height
        };

        var cells = null;
        if (properties.aoColumns != null) {
            for (var i = 0; i < properties.aoColumns.length; i++) {
                if (properties.aoColumns[i] != null) {
                    cells = $("td:nth-child(" + (i + 1) + ")", aoNodes);
                    var oColumnSettings = oDefaultEditableSettings;
                    oColumnSettings = $.extend({}, properties.aoColumns[i], oDefaultEditableSettings);
                    cells.editable(properties.sUpdateURL, oColumnSettings);
                }


            }
        } else {
            cells = $('td:not(.' + properties.sReadOnlyCellClass + ')', aoNodes);
            cells.editable(properties.sUpdateURL, oDefaultEditableSettings);

        }

    }

    //Called when user confirm that he want to add new record
    function _fnOnRowAdding(event) {
        if (properties.fnOnAdding()) {
            if (oAddNewRowForm.valid()) {
                iDisplayStart = _fnGetDisplayStart();
                properties.fnStartProcessingMode();
                var params = oAddNewRowForm.serialize();
                $.ajax({ 'url': properties.sAddURL,
                    'data': params,
                    'type': properties.sAddHttpMethod,
                    success: _fnOnRowAdded,
                    error: function (response) {
                        properties.fnEndProcessingMode();
                        properties.fnShowError(response.responseText, "add");
                        properties.fnOnAdded("failure");
                    }
                });
            }
        }
        event.stopPropagation();
        event.preventDefault();
    }

    ///Event handler called when a new row is added and response is returned from server
    function _fnOnRowAdded(data) {
        properties.fnEndProcessingMode();

        var iColumnCount = oTable.dataTableSettings[0].aoColumns.length;
        var values = new Array();

      $("input:text[rel],input:radio[rel][checked],input:hidden[rel],select[rel],textarea[rel]", oAddNewRowForm).each(function () {
            var rel = $(this).attr("rel");
            if (rel >= iColumnCount)
                properties.fnShowError("In the add form is placed input element with the name '" + $(this).attr("name") + "' with the 'rel' attribute that must be less than a column count - " + iColumnCount, "add");
           else{
                if(this.nodeName.toLowerCase() == "select" || this.tagName.toLowerCase() == "select")
                  values[rel] = $("option:selected", this).text();
                else
                  values[rel] = this.value;
           }
        });

        //Add values from the form into the table
        var rtn = oTable.fnAddData(values);
        var oTRAdded = oTable.fnGetNodes(rtn);
        //Apply editable plugin on the cells of the table
        _fnApplyEditable(oTRAdded);
        //add id returned by server page as an TR id attribute
        properties.fnSetRowID($(oTRAdded), data);
        //Close the dialog
        oAddNewRowForm.dialog('close');
        $(oAddNewRowForm)[0].reset();
        $(".error", $(oAddNewRowForm)).html("");

        _fnSetDisplayStart();
        properties.fnOnAdded("success")
    }

    //Called when user cancels adding new record in the popup dialog
    function _fnOnCancelRowAdding(event) {
        //Close the dialog
        oAddNewRowForm.dialog('close');
        $(oAddNewRowForm)[0].reset();
        $(".error", $(oAddNewRowForm)).html("");
        event.stopPropagation();
        event.preventDefault();
    }





    //Called when user deletes a row
    function _fnOnRowDelete(event) {
        iDisplayStart = _fnGetDisplayStart();
        if ($('tr.' + properties.sSelectedRowClass + ' td', oTable).length == 0) {
            oDeleteRowButton.attr("disabled", "true");
            return;
        }
        var id = fnGetCellID($('tr.' + properties.sSelectedRowClass + ' td', oTable)[0]);
        if (properties.fnOnDeleting($('tr.' + properties.sSelectedRowClass, oTable), id)) {
            properties.fnStartProcessingMode();
            $.ajax({ 'url': properties.sDeleteURL,
                'type': properties.sDeleteHttpMethod,
                'data': 'id=' + id,
                "success": _fnOnRowDeleted,
                "error": function (response) {
                    properties.fnEndProcessingMode();
                    properties.fnShowError(response.responseText, "delete");
                    properties.fnOnDeleted("failure");

                }
            });
        }
    }

    //Called when record is deleted on the server
    function _fnOnRowDeleted(response) {
        properties.fnEndProcessingMode();
        var oTRSelected = $('tr.' + properties.sSelectedRowClass, oTable)[0];
        if (response == "ok" || response == "") {
            oTable.fnDeleteRow(oTRSelected);
            oDeleteRowButton.attr("disabled", "true");
            _fnSetDisplayStart();
            properties.fnOnDeleted("success");
        }
        else {
            properties.fnShowError(response, "delete");
            properties.fnOnDeleted("failure");
        }
    }

    //Called before row is deleted
    //Returning false will abort delete
    /*
    * Function called before row is deleted
    * @param    tr  JQuery wrapped around the TR tag that will be deleted
    * @param    id  id of the record that wil be deleted
    * @return   true if plugin should continue with deleting row, false will abort delete.
    */
    function fnOnDeleting(tr, id) {
        return confirm("Are you sure that you want to delete this record?"); ;
    }

    /* Function called after delete action
    * @param    result  string 
    *           "success" if row is actually deleted 
    *           "failure" if delete failed
    * @return   void
    */
    function fnOnDeleted(result) { }

    function fnOnEditing(input) { return true; }
    function fnOnEdited(result) { }

    function fnOnAdding() { return true; }
    function fnOnAdded(result) { }

    var oSettings;
    function _fnGetDisplayStart() {
        return oSettings._iDisplayStart;
    }

    function _fnSetDisplayStart() {
        if (oSettings.oFeatures.bServerSide === false) {
            oSettings._iDisplayStart = iDisplayStart;
            oSettings.oApi._fnCalculateEnd(oSettings);
            //draw the 'current' page
            oSettings.oApi._fnDraw(oSettings);
        }
    }


        oTable = this;

        var defaults = {
            
            sUpdateURL: "UpdateData",
            sAddURL: "AddData",
            sDeleteURL: "DeleteData",
            height: "14px",
            sAddNewRowFormId: "formAddNewRow",
            sAddNewRowButtonId: "btnAddNewRow",
            sAddNewRowOkButtonId: "btnAddNewRowOk",
            sAddNewRowCancelButtonId: "btnAddNewRowCancel",
            sDeleteRowButtonId: "btnDeleteRow",
            sSelectedRowClass: "row_selected",
            sReadOnlyCellClass: "read_only",
            sAddDeleteToolbarSelector: ".add_delete_toolbar",
            fnShowError: fnShowError,
            fnStartProcessingMode: fnStartProcessingMode,
            fnEndProcessingMode: fnEndProcessingMode,
            aoColumns: null,
            fnOnDeleting: fnOnDeleting,
            fnOnDeleted: fnOnDeleted,
            fnOnAdding: fnOnAdding,
            fnOnAdded: fnOnAdded,
            fnOnEditing: fnOnEditing,
            fnOnEdited: fnOnEdited,
            sAddHttpMethod: 'POST',
            sDeleteHttpMethod: 'POST',
            fnGetRowID: _fnGetRowIDFromAttribute,
            fnSetRowID: _fnSetRowIDInAttribute

        };

        properties = $.extend(defaults, options);
        oSettings = oTable.fnSettings();

        return this.each(function () {

            if (oTable.fnSettings().sAjaxSource!=null) {
                oTable.fnSettings().aoDrawCallback.push({
                    "fn": function () {
                        //Apply jEditable plugin on the table cells
                        _fnApplyEditable(oTable.fnGetNodes());
                        $(oTable.fnGetNodes()).each(function () {
                            var position = oTable.fnGetPosition(this);
                            var id = oTable.fnGetData(position)[0];
                            properties.fnSetRowID($(this), id);
                        }
                        );
                    },
                    "sName": "fnApplyEditable"
                });

            } else {
                //Apply jEditable plugin on the table cells
                _fnApplyEditable(oTable.fnGetNodes());
            }

            //Setup form to open in dialog
            oAddNewRowForm = $("#" + properties.sAddNewRowFormId);
            if (oAddNewRowForm.length != 0) {
                oAddNewRowForm.dialog({ autoOpen: false });

                //Add button click handler on the "Add new row" button
                oAddNewRowButton = $("#" + properties.sAddNewRowButtonId);
                if (oAddNewRowButton.length != 0) {
                    oAddNewRowButton.click(function () { oAddNewRowForm.dialog('open'); });
                } else {
                    if ($(properties.sAddDeleteToolbarSelector).length == 0)
                        throw "Cannot find button for adding new row althogh form for adding new record is specified";
                    else
                        oAddNewRowButton = null;
                }

                oConfirmRowAddingButton = $("#" + properties.sAddNewRowOkButtonId, oAddNewRowForm);
                if (oConfirmRowAddingButton.length == 0) {
                    oAddNewRowForm.append("<button id='" + properties.sAddNewRowOkButtonId + "'>Ok</button>");
                    oConfirmRowAddingButton = $("#" + properties.sAddNewRowOkButtonId, oAddNewRowForm);
                }

                //Add button click handler on the "Ok" button in the add new row dialog
                oConfirmRowAddingButton.click(_fnOnRowAdding);

                oCancelRowAddingButton = $("#" + properties.sAddNewRowCancelButtonId);
                if (oCancelRowAddingButton.length == 0) {
                    oCancelRowAddingButton = oAddNewRowForm.append("<button id='" + properties.sAddNewRowCancelButtonId + "'>Cancel</button>");
                    oCancelRowAddingButton = $("#" + properties.sAddNewRowCancelButtonId);
                }

                oCancelRowAddingButton.click(_fnOnCancelRowAdding);
            } else {
                oAddNewRowForm = null;
            }

            //Set the click handler on the "Delete selected row" button
            oDeleteRowButton = $('#' + properties.sDeleteRowButtonId);
            if (oDeleteRowButton.length != 0)
                oDeleteRowButton.click(_fnOnRowDelete);
            else {
                oDeleteRowButton = null;
            }

            //If an add and delete buttons does not exists but Add-delete toolbar is specificed
            //Autogenerate these buttons
            oAddDeleteToolbar = $(properties.sAddDeleteToolbarSelector);
            if (oAddDeleteToolbar.length != 0) {
                if (oAddNewRowButton == null && properties.sAddNewRowButtonId != ""
                    && oAddNewRowForm != null) {
                    oAddDeleteToolbar.append("<button id='" + properties.sAddNewRowButtonId + "' class='add_row'>Add</button>");
                    oAddNewRowButton = $("#" + properties.sAddNewRowButtonId);
                    oAddNewRowButton.click(function () { oAddNewRowForm.dialog('open'); });
                }
                if (oDeleteRowButton == null && properties.sDeleteRowButtonId != "") {
                    oAddDeleteToolbar.append("<button id='" + properties.sDeleteRowButtonId + "' class='delete_row'>Delete</button>");
                    oDeleteRowButton = $("#" + properties.sDeleteRowButtonId);
                    oDeleteRowButton.click(_fnOnRowDelete);
                }
            }

            //If delete button exists disable it until some row is selected
            if (oDeleteRowButton != null)
                oDeleteRowButton.attr("disabled", "true");

            //Set selected class on row that is clicked
            $("tbody", oTable).click(function (event) {
                if ($(event.target.parentNode).hasClass(properties.sSelectedRowClass)) {
                    $(event.target.parentNode).removeClass(properties.sSelectedRowClass);
                    if (oDeleteRowButton != null)
                        oDeleteRowButton.attr("disabled", "true");
                } else {
                    $(oTable.fnSettings().aoData).each(function () {
                        $(this.nTr).removeClass(properties.sSelectedRowClass);
                    });
                    $(event.target.parentNode).addClass(properties.sSelectedRowClass);
                    if (oDeleteRowButton != null)
                        oDeleteRowButton.removeAttr("disabled");
                }
            });

        });
    };
})(jQuery);