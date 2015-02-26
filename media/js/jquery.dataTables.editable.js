/*global jQuery, $, alert, confirm */
/*jslint browser: true, unparam: true */
/**
 * @project DataTables Editable
 * @maintainer Jeremey Hustman <jeremeyhustman at gmail dot com>
 * @version 3.0.0
 * @contributor Jovan Popovic
 * @file jquery.dataTables.editable.js
 * @copyright Copyright 2010-2012 Jovan Popovic, all rights reserved.
 *
 * This source file is free software, under either the GPL v2 license or a
 * BSD style license, as supplied with this software.
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.
 */

/**
 * @function external:"jQuery.fn".makeeditable
 * @param {string} sUpdateURL - URL of the server-side page used for updating cell. Default value is "UpdateData".
 * @param {string} sAddURL - URL of the server-side page used for adding new row. Default value is "AddData".
 * @param {string} sDeleteURL - URL of the server-side page used to delete row by id. Default value is "DeleteData".
 * @param {function} fnShowError - function(message, action){...}  used to show error message. Action value can be "update", "add" or "delete".
 * @param {string} sAddNewRowFormId - Id of the form for adding new row. Default id is "formAddNewRow".
 * @param {object} oAddNewRowFormOptions - Options that will be set to the "Add new row" dialog
 * @param {string} sAddNewRowButtonId - Id of the button for adding new row. Default id is "btnAddNewRow".
 * @param {object} oAddNewRowButtonOptions - Options that will be set to the "Add new" button
 * @param {string} sAddNewRowOkButtonId - Id of the OK button placed in add new row dialog. Default value is "btnAddNewRowOk".
 * @param {object} oAddNewRowOkButtonOptions - Options that will be set to the Ok button in the "Add new row" form
 * @param {string} sAddNewRowCancelButtonId- Id of the Cancel button placed in add new row dialog. Default value is "btnAddNewRowCancel".
 * @param {object} oAddNewRowCancelButtonOptions - Options that will be set to the Cancel button in the "Add new row" form
 * @param {string} sDeleteRowButtonId - Id of the button for adding new row. Default id is "btnDeleteRow".
 * @param {object} oDeleteRowButtonOptions - Options that will be set to the Delete button
 * @param {string} sSelectedRowClass - Class that will be associated to the selected row. Default class is "row_selected".
 * @param {string} sReadOnlyCellClass - Class of the cells that should not be editable. Default value is "read_only".
 * @param {string} sAddDeleteToolbarSelector - Selector used to identify place where add and delete buttons should be placed. Default value is ".add_delete_toolbar".
 * @param {function} fnStartProcessingMode - function(){...} called when AJAX call is started. Use this function to add "Please wait..." message  when some button is pressed.
 * @param {function} fnEndProcessingMode - function(){...} called when AJAX call is ended. Use this function to close "Please wait..." message.
 * @param {array} aoColumns - Array of the JEditable settings that will be applied on the columns
 * @param {string} sAddHttpMethod - Method used for the Add AJAX request (default is 'POST')
 * @param {string} sAddDataType - Data type expected from the server when adding a row; allowed values are the same as those accepted by JQuery's "datatype" parameter, e.g. 'text' and 'json'. The default is 'text'.
 * @param {string} sDeleteHttpMethod - Method used for the Delete AJAX request (default is 'POST')
 * @param {string} sDeleteDataType - Data type expected from the server when deleting a row; allowed values are the same as those accepted by JQuery's "datatype" parameter, e.g. 'text' and 'json'. The default is 'text'.
 * @param {function} fnOnDeleting - function(tr, id, fnDeleteRow){...} Function called before row is deleted, tr isJQuery object encapsulating row that will be deleted, id is an id of the record that will be deleted. fnDeleteRow(id) callback function that should be called to delete row with id returns true if plugin should continue with deleting row, false will abort delete.
 * @param {function} fnOnDeleted - function(status){...} Function called after delete action. Status can be "success" or "failure"
 * @param {function} fnOnAdding - function(){...} Function called before row is added. returns true if plugin should continue with adding row, false will abort add.
 * @param {function} fnOnNewRowPosted - function(data) Function that can override default function that is called when server-side sAddURL returns resultYou can use this function to add different behaviour when server-side page returns result
 * @param {function} fnOnAdded - function(status){...} Function called after add action. Status can be "success" or "failure"
 * @param {function} fnOnEditing - function(input){...} Function called before cell is updated.input JQuery object wrapping the input element used for editing value in the cell.returns true if plugin should continue with sending AJAX request, false will abort update.
* @param {function} fnOnEdited - function(status){...} Function called after edit action. Status can be "success" or "failure"
* @param {string} sEditorHeight - Default height of the cell editors
* @param {string} sEditorWidth - Default width of the cell editors
* @param {object} oDeleteParameters - Additonal objects added to the DELETE Ajax request
* @param {object} oUpdateParameters - Additonal objects added to the UPDATE Ajax request
* @param {string} sIDToken - Token in the add new row dialog that will be replaced with a returned id of the record that is created eg DT_RowId
* @param {string} sSuccessResponse - Text returned from the server if record is successfully deleted or edited. Default "ok"
* @param {string} sFailureResponsePrefix - Prefix of the error message returned from the server during edit action
*/

$(function () {
    "use strict";
    $.fn.makeEditable = function (options) {

        var iDisplayStart = 0,
            oTable = this, //Reference to the DataTable object

            oAddNewRowButton, //Refences to the buttons used for manipulating table data
            oDeleteRowButton,
            oConfirmRowAddingButton,
            oCancelRowAddingButton,
            //Reference to the form used for adding new data
            oAddNewRowForm,
            //Plugin options
            properties,
            oSettings,

            sOldValue,
            sNewCellValue, //, sNewCellDislayValue;

            nSelectedRow,
            nSelectedCell,
            oKeyTablePosition,



            /**
            * Shows an error message (Defualt function)
            * @param {string} errorText - Text that should be shown
            * @param {string} action - Action that was executed when error
            * occured e.g. "update", "delete", or "add"
            */
            fnShowError = function (errorText, action) {
                alert(errorText);
            },

            /**
            * Function that starts "Processing" mode i.e. shows "Processing..."
            * dialog while some action is executing(Default function)
            */
            fnStartProcessingMode = function () {
                if (oTable.fnSettings().oFeatures.bProcessing) {
                    $(".dataTables_processing").css("visibility", "visible");
                }
            },

            /**
            * Function that ends the "Processing" mode and returns the table in the normal state(Default function)
            * It shows processing message only if bProcessing setting is set to true
            */
            fnEndProcessingMode = function () {
                if (oTable.fnSettings().oFeatures.bProcessing) {
                    $(".dataTables_processing").css("visibility", "hidden");
                }
            },

            /**
            * The default function that is called before row is deleted Returning
            * false will abort delete Function can be overriden via plugin
            * properties in order to create custom delete functionality in that
            * case call fnDeleteRow with parameter id, and return false to prevent
            * double delete action
            * @param {jquery} tr - JQuery wrapper around the TR tag that will be deleted
            * @param {string} id - Id of the record that wil be deleted
            * @param {function(id)} fnDeleteRow - Function that will be called to
            * delete a row. Default - fnDeleteRow(id)
            */
            fnOnDeleting = function (tr, id, fnDeleteRow) {
                return confirm("Are you sure that you want to delete this record?");
            },

            /**
            * Function called after delete action
            * @param {string} result - "success" if row is actually deleted "failure" if delete failed
            * @returns void
            */
            fnOnDeleted = function (result) { return; },

            fnOnEditing = function (input) { return true; },
            fnOnEdited = function (result, sOldValue, sNewValue, iRowIndex, iColumnIndex, iRealColumnIndex) {
                return;
            },

            fnOnAdding = function () { return true; },
            fnOnAdded = function (result) { return; },

            /**
            * Callback function called BEFORE a new record is posted to the server.
            * @todo Check this
            */
            fnOnNewRowPosted = function (data) {
                return true;
            },

            /**
            * Utility function used to get id of the row.
            * It is assumed that id is placed as an id attribute of <tr> that that surround the cell (<td> tag).
            * E.g.:
            * <tr id="17">
            *     <td>...</td><td>...</td><td>...</td><td>...</td>
            * </tr>
            * This function is used when a datatable is configured in the standard
            * client side mode
            * @param {DOM} row - TR row where record is placed
            * @returns {number} - ID of the row - by default id attribute placed in the TR tag
            */
            fnGetRowIDFromAttribute = function (row) {
                return row.attr("id");
            },

            /**
            * Utility function used to set id of the row. Usually when a new record is created, added to the table,
            * and when id of the record is retrieved from the server-side).
            * It is assumed that id is placed as a value of the first &lt;TD&gt; cell in the &lt;TR&gt;. As example:
            * <tr>
            *     <td>17</td><td>...</td><td>...</td><td>...</td>
            * </tr>
            * This function is used when a datatable is configured in the server
            * side processing mode or ajax source mode
            * @param {DOM} row - TR row where record is placed
            */
            fnSetRowIDInFirstCell = function (row, id) {
                $("td:first", row).html(id);
            },

            /**
            * Utility function used to set id of the row. Usually when a new record is created, added to the table,
            * and when id of the record is retrieved from the server-side.
            * It is assumed that id is placed as an id attribute of <tr> that that surround the cell (<td> tag).
            * E.g.:
            * <tr id="17">
            *   <td>...</td><td>...</td><td>...</td><td>...</td>
            * </tr>
            * This function is used when a datatable is configured in the server
            * side processing mode or ajax source mode
            * @param {DOM} row - TR row where record is placed
            */
            fnSetRowIDInAttribute = function (row, id, overwrite) {

                if (overwrite) {
                    row.attr("id", id);
                } else {
                    if (row.attr("id") === null || row.attr("id") === "") {
                        row.attr("id", id);
                    }
                }
            },

            fnOnBeforeAction = function (sAction) {
                return true;
            },

            fnOnActionCompleted = function (sStatus) {
                return;
            },

            /**
            * Populates row with form elements(This should be nly function that
            * read fom elements from form)
            * @param {DOM} iRowID - DatabaseRowID
            * @param {DOM} oForm - Form used to enter data</param>
            * @returns Object or array
            */
            fnTakeRowDataFromFormElements = function (oForm) {

                var iDT_RowId = jQuery.data(oForm, 'DT_RowId'),
                    iColumnCount = oSettings.aoColumns.length,

                    values = [],
                    rowData = {},
                    prop;

                $("input:text[rel],[type=radio][rel][checked='checked'],input:hidden[rel],select[rel],textarea[rel],span.datafield[rel],input:checkbox[rel]", oForm).each(function () {
                    var rel = $(this).attr("rel"),
                        sCellValue = "";
                    if (rel >= iColumnCount) {
                        properties.fnShowError("In the add form is placed input element with the name '" + $(this).attr("name") + "' with the 'rel' attribute that must be less than a column count - " + iColumnCount, "add");
                    } else {
                        if (this.nodeName.toLowerCase() === "select" || this.tagName.toLowerCase() === "select") {
                            //sCellValue = $("option:selected", this).text();
                            sCellValue = $.map($.makeArray($("option:selected", this)), function (n, i) {
                                return $(n).text();
                            }).join(",");
                        } else if (this.nodeName.toLowerCase() === "span" ||
                                   this.tagName.toLowerCase() === "span") {
                            sCellValue = $(this).html();
                        } else {
                            if (this.type === "checkbox") {
                                if (this.checked) {
                                    sCellValue = (this.value !== "on") ? this.value : "true";
                                } else {
                                    sCellValue = (this.value !== "on") ? "" : "false";
                                }
                            } else {
                                sCellValue = this.value;
                            }
                        }
                        //Deprecated
                        sCellValue = sCellValue.replace("DATAROWID", iDT_RowId);
                        sCellValue = sCellValue.replace(properties.sIDToken, iDT_RowId);

                        prop = oSettings.aoColumns[rel].mDataProp !== undefined ?
                                    oSettings.aoColumns[rel].mDataProp : oSettings.aoColumns[rel].mData;

                        if (oSettings.aoColumns !== null &&
                                oSettings.aoColumns[rel] !== null &&
                                isNaN(parseInt(prop, 10))) {
                            rowData[prop] = sCellValue;
                        } else {
                            values[rel] = sCellValue;
                        }
                    }
                });

                prop = oSettings.aoColumns[0].mDataProp !== undefined ?
                        oSettings.aoColumns[0].mDataProp : oSettings.aoColumns[0].mData;
                if (oSettings.aoColumns !== null && isNaN(parseInt(prop, 10))) {
                    return rowData;
                }

                return values;

            }, //End function fnPopulateRowWithFormElements

            fnGetDisplayStart = function fnGetDisplayStart() {
                return oSettings.iDisplayStart;
            },

            /**
            * Utility function used to determine id of the cell By default it is
            * assumed that id is placed as an id attribute of <tr> that surrounds
            * the cell (<td> tag).
            * E.g.:
            * <tr id="17">
            *     <td>...</td><td>...</td><td>...</td><td>...</td>
            * </tr>
            * @function fnGetCellID
            * @param {DOM} cell - TD cell reference
            */
            fnGetCellID = function (cell) {
                return properties.fnGetRowID($(cell.parentNode));
            },


            /**
            * Set the pagination position (do nothing in the server-side mode)
            */
            fnSetDisplayStart = function () {
                //To refresh table with preserver pagination on cell edit
                //if (oSettings.oFeatures.bServerSide === false) {
                oSettings.iDisplayStart = iDisplayStart;
                /*oSettings.oApi.fnCalculateEnd(oSettings);*/
                //draw the 'current' page
                /*oSettings.oApi.fnDraw(oSettings);*/
                //}
            },


            /**
            * Function that applies editable plugin to the array of table rows
            * @param {array} aoNodes - Array of table rows &lt;TR&gt; that should be initialized with editable plugin
            */
            fnApplyEditable = function (aoNodes) {
                if (properties.bDisableEditing) {
                    return;
                }
                var sNewCellDisplayValue,
                    oEditElement,
                    input,
                    oDefaultEditableSettings = {
                        event: "dblclick",

                        "onsubmit": function (settings, original) {
                            sOldValue = original.revert;
                            sNewCellValue = null;
                            iDisplayStart = fnGetDisplayStart();

                            sNewCellDisplayValue = null;

                            if (settings.type === "text" ||
                                    settings.type === "select" ||
                                    settings.type === "textarea") {

                                input = $("input,select,textarea", this);
                                sNewCellValue = $("input,select,textarea", $(this)).val();
                                if (input.length === 1) {
                                    oEditElement = input[0];
                                    if (oEditElement.nodeName.toLowerCase() === "select" || oEditElement.tagName.toLowerCase() === "select") {
                                        sNewCellDisplayValue = $("option:selected", oEditElement).text(); //For select list use selected text instead of value for displaying in table
                                    } else {
                                        sNewCellDisplayValue = sNewCellValue;
                                    }
                                }

                                if (!properties.fnOnEditing(input, settings, original.revert, fnGetCellID(original))) {
                                    return false;
                                }
                                /*var x = settings;*/

                                //2.2.2 INLINE VALIDATION
                                if (settings.oValidationOptions !== null) {
                                    input.parents("form").validate(settings.oValidationOptions);
                                }
                                if (settings.cssclass !== null) {
                                    input.addClass(settings.cssclass);
                                }
                                if (settings.cssclass === null && settings.oValidationOptions === null) {
                                    return true;
                                }
                                if (!input.valid() || 0 === input.valid()) {
                                    return false;
                                }
                                return true;
                            }

                            properties.fnStartProcessingMode();
                        },
                        "submitdata": function (value, settings) {
                            //iDisplayStart = fnGetDisplayStart();
                            //properties.fnStartProcessingMode();
                            var id = fnGetCellID(this),
                                rowId = oTable.fnGetPosition(this)[0],
                                columnPosition = oTable.fnGetPosition(this)[1],
                                columnId = oTable.fnGetPosition(this)[2],
                                sColumnName = oTable.fnSettings().aoColumns[columnId].sName,
                                updateData = null;

                            if (sColumnName === null || sColumnName === "") {
                                sColumnName = oTable.fnSettings().aoColumns[columnId].sTitle;
                            }

                            if (properties.aoColumns === null || properties.aoColumns[columnId] === null) {
                                updateData = $.extend({}, properties.oUpdateParameters, {
                                    "id": id,
                                    "rowId": rowId,
                                    "columnPosition": columnPosition,
                                    "columnId": columnId,
                                    "columnName": sColumnName
                                });
                            } else {
                                updateData = $.extend({},
                                                    properties.oUpdateParameters,
                                                    properties.aoColumns[columnId].oUpdateParameters, {
                                        "id": id,
                                        "rowId": rowId,
                                        "columnPosition": columnPosition,
                                        "columnId": columnId,
                                        "columnName": sColumnName
                                    });
                            }
                            return updateData;
                        },
                        "callback": function (sValue, settings) {
                            properties.fnEndProcessingMode();
                            var status = "",
                                keys,
                                aPos = oTable.fnGetPosition(this),
                                bRefreshTable = !oSettings.oFeatures.bServerSide;

                            $("td.last-updated-cell", oTable.fnGetNodes()).removeClass("last-updated-cell");
                            if (sValue.indexOf(properties.sFailureResponsePrefix) > -1) {
                                oTable.fnUpdate(sOldValue, aPos[0], aPos[2], bRefreshTable);
                                $("td.last-updated-cell", oTable).removeClass("last-updated-cell");
                                $(this).addClass("last-updated-cell");
                                properties.fnShowError(sValue.replace(properties.sFailureResponsePrefix, "").trim(), "update");
                                status = "failure";
                            } else {

                                if (properties.sSuccessResponse === "IGNORE" ||
                                        (properties.aoColumns !== null &&
                                        properties.aoColumns[aPos[2]] !== null &&
                                        properties.aoColumns[aPos[2]].sSuccessResponse === "IGNORE") ||
                                        (sNewCellValue === null) || (sNewCellValue === sValue) ||
                                        properties.sSuccessResponse === sValue) {
                                    if (sNewCellDisplayValue === null) {
                                        //sNewCellDisplayValue = sValue;
                                        oTable.fnUpdate(sValue, aPos[0], aPos[2], bRefreshTable);
                                    } else {
                                        oTable.fnUpdate(sNewCellDisplayValue, aPos[0], aPos[2], bRefreshTable);
                                    }
                                    $("td.last-updated-cell", oTable).removeClass("last-updated-cell");
                                    $(this).addClass("last-updated-cell");
                                    status = "success";
                                } else {
                                    oTable.fnUpdate(sOldValue, aPos[0], aPos[2], bRefreshTable);
                                    properties.fnShowError(sValue, "update");
                                    status = "failure";
                                }
                            }

                            properties.fnOnEdited(status, sOldValue, sNewCellDisplayValue, aPos[0], aPos[1], aPos[2]);
                            /*if (settings.fnOnCellUpdated !== null) {
                                settings.fnOnCellUpdated(status, sValue, aPos[0], aPos[2], settings);
                            }*/

                            fnSetDisplayStart();
                            if (properties.bUseKeyTable) {
                                keys = oTable.keys;
                                /* Unblock KeyTable, but only after this 'esc' key event has finished. Otherwise
                                * it will 'esc' KeyTable as well
                                */
                                setTimeout(function () { keys.block = false; }, 0);
                            }
                        },
                        "onerror": function () {
                            properties.fnEndProcessingMode();
                            properties.fnShowError("Cell cannot be updated", "update");
                            properties.fnOnEdited("failure");
                        },

                        "onreset": function () {
                            if (properties.bUseKeyTable) {
                                var keys = oTable.keys;
                                /* Unblock KeyTable, but only after this 'esc' key event has finished. Otherwise
                                * it will 'esc' KeyTable as well
                                */
                                setTimeout(function () { keys.block = false; }, 0);
                            }

                        },
                        "height": properties.sEditorHeight,
                        "width": properties.sEditorWidth
                    },

                    cells = null,
                    iDTindex = 0,
                    iDTEindex = 0,
                    oColumnSettings,
                    sUpdateURL;

                if (properties.aoColumns !== null) {

                    for (iDTindex, iDTEindex; iDTindex < oSettings.aoColumns.length; iDTindex += 1) {
                        if (oSettings.aoColumns[iDTindex].bVisible) {//if DataTables column is visible
                            if (properties.aoColumns[iDTEindex] === null) {
                                //If editor for the column is not defined go to the next column
                                iDTEindex += 1;
                                continue;
                            }
                            //Get all cells in the iDTEindex column (nth child is 1-indexed array)
                            cells = $("td:nth-child(" + (iDTEindex + 1) + ")", aoNodes);

                            oColumnSettings = oDefaultEditableSettings;
                            oColumnSettings = $.extend({}, oDefaultEditableSettings, properties.oEditableSettings, properties.aoColumns[iDTEindex]);
                            iDTEindex += 1;
                            sUpdateURL = properties.sUpdateURL;
                            try {
                                if (oColumnSettings.sUpdateURL !== null) {
                                    sUpdateURL = oColumnSettings.sUpdateURL;
                                }
                            } catch (ex) {
                            }
                            //cells.editable(sUpdateURL, oColumnSettings);
                            cells.each(function () {
                                if (!$(this).hasClass(properties.sReadOnlyCellClass)) {
                                    $(this).editable(sUpdateURL, oColumnSettings);
                                }
                            });
                        }

                    } //end for
                } else {
                    cells = $("td:not(." + properties.sReadOnlyCellClass + ")", aoNodes);
                    cells.editable(properties.sUpdateURL, $.extend({}, oDefaultEditableSettings, properties.oEditableSettings));
                }
            },



            /**
            * Function that is called when a new row is added, and Ajax response
            * is returned from server This function takes data from the add form
            * and adds them into the table.
            * @param {int} data - ID of the new row that is returned from the server.
            */
            fnOnRowAdded = function (data) {

                var values,
                    rtn,
                    oTRAdded,
                    prop,
                    keys;

                properties.fnEndProcessingMode();

                if (properties.fnOnNewRowPosted(data)) {

                    oSettings = oTable.fnSettings();
                    if (!oSettings.oFeatures.bServerSide) {
                        $.data(oAddNewRowForm, "DT_RowId", data);
                        values = fnTakeRowDataFromFormElements(oAddNewRowForm);

                        //Add values from the form into the table
                        prop = oSettings.aoColumns[0].mDataProp !== undefined ?
                                    oSettings.aoColumns[0].mDataProp : oSettings.aoColumns[0].mData;

                        if (oSettings.aoColumns !== null && isNaN(parseInt(prop, 10))) {
                            rtn = oTable.fnddData(data);
                        } else {
                            rtn = oTable.fnAddData(values);
                        }

                        oTRAdded = oTable.fnGetNodes(rtn);
                        //add id returned by server page as an TR id attribute
                        properties.fnSetRowID($(oTRAdded), data, true);
                        //Apply editable plugin on the cells of the table
                        fnApplyEditable(oTRAdded);

                        $("tr.last-added-row", oTable).removeClass("last-added-row");
                        $(oTRAdded).addClass("last-added-row");
                    } /*else {
                        oTable.fnDraw(false);
                        }*/
                        //Close the dialog
                    oAddNewRowForm.dialog("close");
                    $(oAddNewRowForm)[0].reset();
                    $(".error", $(oAddNewRowForm)).html("");

                    fnSetDisplayStart();
                    properties.fnOnAdded("success");
                    if (properties.bUseKeyTable) {
                        keys = oTable.keys;
                        /* Unblock KeyTable, but only after this 'esc' key event has finished. Otherwise
                        * it will 'esc' KeyTable as well
                        */
                        setTimeout(function () { keys.block = false; }, 0);
                    }
                }
            },
            fnOnRowAdding = function fnOnRowAdding(event) {
                ///<summary>
                ///Event handler called when a user click on the submit button in the "Add new row" form.
                ///</summary>
                ///<param name="event">Event that caused the action</param>

                if (properties.fnOnAdding()) {
                    if (oAddNewRowForm.valid()) {
                        iDisplayStart = fnGetDisplayStart();
                        properties.fnStartProcessingMode();

                        if (properties.bUseFormsPlugin) {
                            //Still in beta(development)
                            $(oAddNewRowForm).ajaxSubmit({
                                dataType: "xml",
                                success: function (response, statusString, xhr) {
                                    if (xhr.responseText.toLowerCase().indexOf("error") !== -1) {
                                        properties.fnEndProcessingMode();
                                        properties.fnShowError(xhr.responseText.replace("Error", ""), "add");
                                        properties.fnOnAdded("failure");
                                    } else {
                                        fnOnRowAdded(xhr.responseText);
                                    }

                                },
                                error: function (response) {
                                    properties.fnEndProcessingMode();
                                    properties.fnShowError(response.responseText, "add");
                                    properties.fnOnAdded("failure");
                                }
                            }
                                                        );

                        } else {

                            var params = oAddNewRowForm.serialize();
                            $.ajax({ "url": properties.sAddURL,
                                    "data": params,
                                    "type": properties.sAddHttpMethod,
                                    "dataType": properties.sAddDataType,
                                    success: fnOnRowAdded,
                                    error: function (response) {
                                    properties.fnEndProcessingMode();
                                    properties.fnShowError(response.responseText, "add");
                                    properties.fnOnAdded("failure");
                                }
                                });
                        }
                    }
                }
                event.stopPropagation();
                event.preventDefault();
            },

            /**
            * Function that enables the delete button.
            */
            fnEnableDeleteButton = function () {
                if (properties.oDeleteRowButtonOptions !== null) {
                    //oDeleteRowButton.enable();
                    oDeleteRowButton.button("option", "disabled", false);
                } else {
                    oDeleteRowButton.removeAttr("disabled");
                }
            },


            /**
            * Utility function used to get id of the row.
            * It is assumed that id is placed as a value of the first &lt;TD&gt; cell in the &lt;TR&gt;.
            * As example:
            * <tr>
            * 	<td>17</td><td>...</td><td>...</td><td>...</td>
            * </tr>
            * This function is used when a datatable is configured in the server side processing mode or ajax source mode
            * @param {DOM} row - TR row where record is placed
            * @returns {number} - Id of the row - by default id attribute placed in the TR tag
            */
            fnGetRowIDFromFirstCell = function (row) {
                return $("td:first", row).html();
            },



            /**
            *
            * Event handler function that is executed when a user press cancel
            * button in the add new row form This function clean the add form and
            * error messages if some of them are shown
            * @param {int} event - DOM event that caused an error
            */
            fnOnCancelRowAdding = function (event) {
                //Clear the validation messages and reset form
                $(oAddNewRowForm).validate().resetForm();  // Clears the validation errors
                $(oAddNewRowForm)[0].reset();

                $(".error", $(oAddNewRowForm)).html("");
                $(".error", $(oAddNewRowForm)).hide();  // Hides the error element

                //Close the dialog
                oAddNewRowForm.dialog("close");
                event.stopPropagation();
                event.preventDefault();
            },

            /**
            * Function that disables the delete button.
            */
            fnDisableDeleteButton = function () {
                if (properties.bUseKeyTable) {
                    return;
                }
                if (properties.oDeleteRowButtonOptions !== null) {
                    //oDeleteRowButton.disable();
                    oDeleteRowButton.button("option", "disabled", true);
                } else {
                    oDeleteRowButton.attr("disabled", "true");
                }
            },


            fnOnRowDeleteInline = function (e) {
                var sURL = $(this).attr("href");
                if (sURL === null || sURL === "") {
                    sURL = properties.sDeleteURL;
                }

                e.preventDefault();
                e.stopPropagation();

                iDisplayStart = fnGetDisplayStart();

                nSelectedCell = ($(this).parents("td"))[0];
                jSelectedRow = ($(this).parents("tr"));
                nSelectedRow = jSelectedRow[0];

                jSelectedRow.addClass(properties.sSelectedRowClass);

                var id = fnGetCellID(nSelectedCell);
                if (properties.fnOnDeleting(jSelectedRow, id, fnDeleteRow)) {
                    fnDeleteRow(id, sURL);
                }
            },

            /**
            * Event handler for the delete button
            * @param {event} event - DOM event
            */
            fnOnRowDelete = function (event) {
                event.preventDefault();
                event.stopPropagation();

                iDisplayStart = fnGetDisplayStart();

                nSelectedRow = null;
                nSelectedCell = null;

                if (!properties.bUseKeyTable) {
                    if ($("tr." + properties.sSelectedRowClass + " td", oTable).length === 0) {
                        //oDeleteRowButton.attr("disabled", "true");
                        fnDisableDeleteButton();
                        return;
                    }
                    nSelectedCell = $("tr." + properties.sSelectedRowClass + " td", oTable)[0];
                } else {
                    nSelectedCell = $("td.focus", oTable)[0];

                }
                if (nSelectedCell === null) {
                    fnDisableDeleteButton();
                    return;
                }
                if (properties.bUseKeyTable) {
                    oKeyTablePosition = oTable.keys.fnGetCurrentPosition();
                }
                var id = fnGetCellID(nSelectedCell);
                var jSelectedRow = $(nSelectedCell).parent("tr");
                nSelectedRow = jSelectedRow[0];
                if (properties.fnOnDeleting(jSelectedRow, id, fnDeleteRow)) {
                    fnDeleteRow(id);
                }
            },

            /**
            * Function that deletes a row with an id, using the sDeleteURL server
            * page
            * @param {int} id - Id of the row that will be deleted. Id value is
            * placed in the attribute of the TR tag that will be deleted
            * @param {string} sDeleteURL - Server URL where delete request will be
            * posted
            */
            fnDeleteRow = function (id, sDeleteURL) {
                var sURL = sDeleteURL;
                if (!sDeleteURL) { sURL = properties.sDeleteURL; }
                properties.fnStartProcessingMode();
                var data = $.extend(properties.oDeleteParameters, { "id": id });
                $.ajax({ "url": sURL,
                    "type": properties.sDeleteHttpMethod,
                    "data": data,
                    "success": fnOnRowDeleted,
                    "dataType": properties.sDeleteDataType,
                    "error": function (response) {
                        properties.fnEndProcessingMode();
                        properties.fnShowError(response.responseText, "delete");
                        properties.fnOnDeleted("failure");

                    }
                });
            },

            /**
            * Called after the record is deleted on the server (in the ajax success callback)
            * @param {string} response - Response text eturned from the server-side page</param>
            */
            fnOnRowDeleted = function (response) {
                properties.fnEndProcessingMode();
                var oTRSelected = nSelectedRow;
                /*
                if (!properties.bUseKeyTable) {
                oTRSelected = $('tr.' + properties.sSelectedRowClass, oTable)[0];
                } else {
                oTRSelected = $("td.focus", oTable)[0].parents("tr")[0];
                }
                */
                if (response === properties.sSuccessResponse || response === "") {
                    oTable.fnDeleteRow(oTRSelected);
                    fnDisableDeleteButton();
                    fnSetDisplayStart();
                    if (properties.bUseKeyTable) {
                        oTable.keys.fnSetPosition(oKeyTablePosition[0], oKeyTablePosition[1]);
                    }
                    properties.fnOnDeleted("success");
                }
                else {
                    properties.fnShowError(response, "delete");
                    properties.fnOnDeleted("failure");
                }
            },

            /**
            * Returns settings object for the action.
            * @param {string} sAction - The name of the action.
            */
            fnGetActionSettings = function (sAction) {
                if (properties.aoTableAction) {
                    properties.fnShowError("Configuration error - aoTableAction setting are not set", sAction);
                }
                var i = 0;

                for (i = 0; i < properties.aoTableActions.length; i++) {
                    if (properties.aoTableActions[i].sAction == sAction)
                        return properties.aoTableActions[i];
                }

                properties.fnShowError("Cannot find action configuration settings", sAction);
            },

            /**
            * Populates forms with row data
            * @param {DOM} oForm - Form used to enter data
            * @param {DOM} oTR - Table Row that will populate data
            */
            fnPopulateFormWithRowCells = function (oForm, oTR) {

                var iRowID = oTable.fnGetPosition(oTR);

                var id = properties.fnGetRowID($(oTR));

                $(oForm).validate().resetForm();
                $.data($(oForm)[0], "DT_RowId", id);
                $("input.DT_RowId", $(oForm)).val(id);
                $.data($(oForm)[0], "ROWID", iRowID);
                $("input.ROWID", $(oForm)).val(iRowID);


                var oSettings = oTable.fnSettings();
                var iColumnCount = oSettings.aoColumns.length;


                $("input:text[rel],input:radio[rel][checked],input:hidden[rel],select[rel],textarea[rel],input:checkbox[rel]",
                $(oForm)).each(function () {
                    var rel = $(this).attr("rel");

                    if (rel >= iColumnCount) {
                        properties.fnShowError("In the form is placed input element with the name '" +
                                                $(this).attr("name") + "' with the 'rel' attribute that must be less than a column count - " +
                                                iColumnCount, "action");
                    } else {
                        var sCellValue = oTable.fnGetData(oTR)[rel];
                        if (this.nodeName.toLowerCase() === "select" || this.tagName.toLowerCase() === "select") {

                            if (this.multiple === true) {
                                var aoSelectedValue = [];
                                aoCellValues = sCellValue.split(",");
                                for (var i = 0; i <= this.options.length - 1; i += 1) {
                                    if (jQuery.inArray(this.options[i].text.toLowerCase().trim(), aoCellValues) !== -1) {
                                        aoSelectedValue.push(this.options[i].value);
                                    }
                                }
                                $(this).val(aoSelectedValue);
                            } else {
                                for (i = 0; i <= this.options.length - 1; i++) {
                                    if (this.options[i].text.toLowerCase() === sCellValue.toLowerCase()) {
                                        $(this).val(this.options[i].value);
                                    }
                                }
                            }

                        } else if (this.nodeName.toLowerCase() === "span" || this.tagName.toLowerCase() === "span") {
                            $(this).html(sCellValue);
                        } else {
                            if (this.type === "checkbox") {
                                if (sCellValue === "true") {
                                    $(this).attr("checked", true);
                                }
                            } else {
                                if (this.type === "radio") {
                                    if (this.value === sCellValue) {
                                        this.checked = true;
                                    }
                                } else {
                                    this.value = sCellValue;
                                }
                            }
                        }

                        //sCellValue = sCellValue.replace(properties.sIDToken, data);
                        //values[rel] = sCellValue;
                        //oTable.fnUpdate(sCellValue, iRowID, rel);
                    }
                });
            }, //End function fnPopulateFormWithRowCells



            /**
            * Updates table row using form fields
            * @param {DOM} nActionForm - Form used to enter data
            */
            fnSendFormUpdateRequest = function (nActionForm) {
                var jActionForm = $(nActionForm);
                var sAction = jActionForm.attr("id");

                sAction = sAction.replace("form", "");
                var sActionURL = jActionForm.attr("action");
                if (properties.fnOnBeforeAction(sAction)) {
                    if (jActionForm.valid()) {
                        iDisplayStart = fnGetDisplayStart();
                        properties.fnStartProcessingMode();
                        if (properties.bUseFormsPlugin) {

                            //Still in beta(development)
                            var oAjaxSubmitOptions = {
                                success: function (response, statusString, xhr) {
                                    properties.fnEndProcessingMode();
                                    if (response.toLowerCase().indexOf("error") !== -1 || statusString !== "success") {
                                        properties.fnShowError(response, sAction);
                                        properties.fnOnActionCompleted("failure");
                                    } else {
                                        fnUpdateRowOnSuccess(nActionForm);
                                        properties.fnOnActionCompleted("success");
                                    }

                                },
                                error: function (response) {
                                    properties.fnEndProcessingMode();
                                    properties.fnShowError(response.responseText, sAction);
                                    properties.fnOnActionCompleted("failure");
                                }
                            };
                            var oActionSettings = fnGetActionSettings(sAction);
                            oAjaxSubmitOptions = $.extend({}, properties.oAjaxSubmitOptions, oAjaxSubmitOptions);
                            $(oActionForm).ajaxSubmit(oAjaxSubmitOptions);

                        } else {
                            var params = jActionForm.serialize();
                            $.ajax({ 'url': sActionURL,
                                'data': params,
                                'type': properties.sAddHttpMethod,
                                'dataType': properties.sAddDataType,
                                success: function (response) {
                                    properties.fnEndProcessingMode();
                                    fnUpdateRowOnSuccess(nActionForm);
                                    properties.fnOnActionCompleted("success");
                                },
                                error: function (response) {
                                    properties.fnEndProcessingMode();
                                    properties.fnShowError(response.responseText, sAction);
                                    properties.fnOnActionCompleted("failure");
                                }
                            });
                        }
                    }
                }
            },


            defaults = {

                sUpdateURL: "UpdateData",
                sAddURL: "AddData",
                sDeleteURL: "DeleteData",
                sAddNewRowFormId: "formAddNewRow",
                oAddNewRowFormOptions: { autoOpen: false, modal: true },
                sAddNewRowButtonId: "btnAddNewRow",
                oAddNewRowButtonOptions: null,
                sAddNewRowOkButtonId: "btnAddNewRowOk",
                sAddNewRowCancelButtonId: "btnAddNewRowCancel",
                oAddNewRowOkButtonOptions: { label: "Ok" },
                oAddNewRowCancelButtonOptions: { label: "Cancel" },
                sDeleteRowButtonId: "btnDeleteRow",
                oDeleteRowButtonOptions: null,
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
                fnOnNewRowPosted: fnOnNewRowPosted,
                fnOnAdded: fnOnAdded,
                fnOnEditing: fnOnEditing,
                fnOnEdited: fnOnEdited,
                sAddHttpMethod: 'POST',
                sAddDataType: "text",
                sDeleteHttpMethod: 'POST',
                sDeleteDataType: "text",
                fnGetRowID: fnGetRowIDFromAttribute,
                fnSetRowID: fnSetRowIDInAttribute,
                sEditorHeight: "100%",
                sEditorWidth: "100%",
                bDisableEditing: false,
                oDeleteParameters: {},
                oUpdateParameters: {},
                sIDToken: "DT_RowId",
                aoTableActions: null,
                fnOnBeforeAction: fnOnBeforeAction,
                bUseFormsPlugin: false,
                fnOnActionCompleted: fnOnActionCompleted,
                sSuccessResponse: "ok",
                sFailureResponsePrefix: "ERROR",
                oKeyTable: null        //KEYTABLE

            };

        properties = $.extend(defaults, options);
        oSettings = oTable.fnSettings();
        properties.bUseKeyTable = (properties.oKeyTable !== null);

        return this.each(function () {
            var sTableId = oTable.dataTableSettings[0].sTableId,
                KeyTable,
                keys;
            //KEYTABLE
            if (properties.bUseKeyTable) {
                keys = new KeyTable({
                    "table": document.getElementById(sTableId),
                    "datatable": oTable
                });
                oTable.keys = keys;

                /* Apply a return key event to each cell in the table */
                keys.event.action(null, null, function (nCell) {
                    if ($(nCell).hasClass(properties.sReadOnlyCellClass)) {
                        return;
                    }
                    /* Block KeyTable from performing any events while jEditable is in edit mode */
                    keys.block = true;
                    /* Dispatch click event to go into edit mode - Saf 4 needs a timeout... */
                    setTimeout(function () { $(nCell).dblclick(); }, 0);
                    //properties.bDisableEditing = true;
                });
            }

            //KEYTABLE

            if (oTable.fnSettings().sAjaxSource !== null) {
                oTable.fnSettings().aoDrawCallback.push({
                    "fn": function () {
                        //Apply jEditable plugin on the table cells
                        fnApplyEditable(oTable.fnGetNodes());
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
                fnApplyEditable(oTable.fnGetNodes());
            }

            //Setup form to open in dialog
            oAddNewRowForm = $("#" + properties.sAddNewRowFormId);
            if (oAddNewRowForm.length !== 0) {

                ///Check does the add new form has all nessecary fields
                var oSettings = oTable.fnSettings(),
                    iColumnCount = oSettings.aoColumns.length,
                    i = 0;
                for (i; i < iColumnCount; i += 1) {
                    if ($("[rel=" + i + "]", oAddNewRowForm).length === 0) {
                        properties.fnShowError("In the form that is used for adding new records cannot be found an input element with rel=" + i + " that will be bound to the value in the column " + i + ". See http://code.google.com/p/jquery-datatables-editable/wiki/AddingNewRecords#Add_new_record_form for more details", "init");
                    }
                }


                if (properties.oAddNewRowFormOptions !== null) {
                    properties.oAddNewRowFormOptions.autoOpen = false;
                } else {
                    properties.oAddNewRowFormOptions = { autoOpen: false };
                }
                oAddNewRowForm.dialog(properties.oAddNewRowFormOptions);

                //Add button click handler on the "Add new row" button
                oAddNewRowButton = $("#" + properties.sAddNewRowButtonId);
                if (oAddNewRowButton.length !== 0) {

                    if (oAddNewRowButton.data("add-event-attached") !== "true") {
                        oAddNewRowButton.click(function () {
                            oAddNewRowForm.dialog('open');
                        });
                        oAddNewRowButton.data("add-event-attached", "true");
                    }

                } else {
                    if ($(properties.sAddDeleteToolbarSelector).length === 0) {
                        throw "Cannot find a button with an id '" +
                            properties.sAddNewRowButtonId +
                            "', or placeholder with an id '" +
                            properties.sAddDeleteToolbarSelector +
                            "' that should be used for adding new row although form for adding new record is specified";
                    } else {
                        oAddNewRowButton = null; //It will be auto-generated later
                    }
                }

                //Prevent Submit handler
                if (oAddNewRowForm[0].nodeName.toLowerCase() === "form") {
                    oAddNewRowForm.unbind('submit');
                    oAddNewRowForm.submit(function (event) {
                        fnOnRowAdding(event);
                        return false;
                    });
                } else {
                    $("form", oAddNewRowForm[0]).unbind('submit');
                    $("form", oAddNewRowForm[0]).submit(function (event) {
                        fnOnRowAdding(event);
                        return false;
                    });
                }

                // array to add default buttons to
                var aAddNewRowFormButtons = [];

                oConfirmRowAddingButton = $("#" + properties.sAddNewRowOkButtonId, oAddNewRowForm);
                if (oConfirmRowAddingButton.length === 0) {
                    //If someone forgotten to set the button text
                    if (properties.oAddNewRowOkButtonOptions.text === null ||
                            properties.oAddNewRowOkButtonOptions.text === "") {
                        properties.oAddNewRowOkButtonOptions.text = "Ok";
                    }
                    properties.oAddNewRowOkButtonOptions.click = fnOnRowAdding;
                    properties.oAddNewRowOkButtonOptions.id = properties.sAddNewRowOkButtonId;
                    // push the add button onto the array
                    aAddNewRowFormButtons.push(properties.oAddNewRowOkButtonOptions);
                } else {
                    oConfirmRowAddingButton.click(fnOnRowAdding);
                }

                oCancelRowAddingButton = $("#" + properties.sAddNewRowCancelButtonId);
                if (oCancelRowAddingButton.length === 0) {
                    //If someone forgotten to the button text
                    if (properties.oAddNewRowCancelButtonOptions.text === null ||
                            properties.oAddNewRowCancelButtonOptions.text === "") {
                        properties.oAddNewRowCancelButtonOptions.text = "Cancel";
                    }
                    properties.oAddNewRowCancelButtonOptions.click = fnOnCancelRowAdding;
                    properties.oAddNewRowCancelButtonOptions.id = properties.sAddNewRowCancelButtonId;
                    // push the cancel button onto the array
                    aAddNewRowFormButtons.push(properties.oAddNewRowCancelButtonOptions);
                } else {
                    oCancelRowAddingButton.click(fnOnCancelRowAdding);
                }
                // if the array contains elements, add them to the dialog
                if (aAddNewRowFormButtons.length > 0) {
                    oAddNewRowForm.dialog('option', 'buttons', aAddNewRowFormButtons);
                }
                //Issue: It cannot find it with this call:
                //oConfirmRowAddingButton = $("#" + properties.sAddNewRowOkButtonId, oAddNewRowForm);
                //oCancelRowAddingButton = $("#" + properties.sAddNewRowCancelButtonId, oAddNewRowForm);
                oConfirmRowAddingButton = $("#" + properties.sAddNewRowOkButtonId);
                oCancelRowAddingButton = $("#" + properties.sAddNewRowCancelButtonId);

                if (properties.oAddNewRowFormValidation !== null) {
                    oAddNewRowForm.validate(properties.oAddNewRowFormValidation);
                }
            } else {
                oAddNewRowForm = null;
            }

            //Set the click handler on the "Delete selected row" button
            oDeleteRowButton = $('#' + properties.sDeleteRowButtonId);
            if (oDeleteRowButton.length !== 0) {
                if (oDeleteRowButton.data("delete-event-attached") !== "true") {
                    oDeleteRowButton.click(fnOnRowDelete);
                    oDeleteRowButton.data("delete-event-attached", "true");
                }
            } else {
                oDeleteRowButton = null;
            }

            //If an add and delete buttons does not exists but Add-delete toolbar is specificed
            //Autogenerate these buttons
            var oAddDeleteToolbar = $(properties.sAddDeleteToolbarSelector);
            if (oAddDeleteToolbar.length !== 0) {
                if (oAddNewRowButton === null &&
                        properties.sAddNewRowButtonId !== "" &&
                        oAddNewRowForm !== null) {
                    oAddDeleteToolbar.append("<button id='" + properties.sAddNewRowButtonId + "' class='add_row'>Add</button>");
                    oAddNewRowButton = $("#" + properties.sAddNewRowButtonId);
                    oAddNewRowButton.click(function () { oAddNewRowForm.dialog('open'); });
                }
                if (oDeleteRowButton === null && properties.sDeleteRowButtonId !== "") {
                    oAddDeleteToolbar.append("<button id='" + properties.sDeleteRowButtonId + "' class='delete_row'>Delete</button>");
                    oDeleteRowButton = $("#" + properties.sDeleteRowButtonId);
                    oDeleteRowButton.click(fnOnRowDelete);
                }
            }

            //If delete button exists disable it until some row is selected
            if (oDeleteRowButton !== null) {
                if (properties.oDeleteRowButtonOptions !== null) {
                    oDeleteRowButton.button(properties.oDeleteRowButtonOptions);
                }
                fnDisableDeleteButton();
            }

            //If add button exists convert it to the JQuery-ui button
            if (oAddNewRowButton !== null) {
                if (properties.oAddNewRowButtonOptions !== null) {
                    oAddNewRowButton.button(properties.oAddNewRowButtonOptions);
                }
            }


            //If form ok button exists convert it to the JQuery-ui button
            if (oConfirmRowAddingButton !== null) {
                if (properties.oAddNewRowOkButtonOptions !== null) {
                    oConfirmRowAddingButton.button(properties.oAddNewRowOkButtonOptions);
                }
            }

            //If form cancel button exists convert it to the JQuery-ui button
            if (oCancelRowAddingButton !== null) {
                if (properties.oAddNewRowCancelButtonOptions !== null) {
                    oCancelRowAddingButton.button(properties.oAddNewRowCancelButtonOptions);
                }
            }


            //Add handler to the inline delete buttons
            //$(".table-action-deletelink", oTable).live("click", fnOnRowDeleteInline); //live deprecated
            $(oTable).on("click", ".table-action-deletelink", fnOnRowDeleteInline);

            if (!properties.bUseKeyTable) {
                //Set selected class on row that is clicked
                //Enable delete button if row is selected, disable delete button if selected class is removed
                $("tbody", oTable).click(function (event) {
                    if ($(event.target.parentNode).hasClass(properties.sSelectedRowClass)) {
                        $(event.target.parentNode).removeClass(properties.sSelectedRowClass);
                        if (oDeleteRowButton !== null) {
                            fnDisableDeleteButton();
                        }
                    } else {
                        $(oTable.fnSettings().aoData).each(function () {
                            $(this.nTr).removeClass(properties.sSelectedRowClass);
                        });
                        $(event.target.parentNode).addClass(properties.sSelectedRowClass);
                        if (oDeleteRowButton !== null) {
                            fnEnableDeleteButton();
                        }
                    }
                });
            } else {
                oTable.keys.event.focus(null, null, function (nNode, x, y) {

                });
            }

            if (properties.aoTableActions !== null) {
                for (var i = 0; i < properties.aoTableActions.length; i++) {
                    var oTableAction = $.extend({ sType: "edit" }, properties.aoTableActions[i]);
                    var sAction = oTableAction.sAction;
                    var sActionFormId = oTableAction.sActionFormId;

                    var oActionForm = $("#form" + sAction);
                    if (oActionForm.length !== 0) {
                        var oFormOptions = { autoOpen: false, modal: true };
                        oFormOptions = $.extend({}, oTableAction.oFormOptions, oFormOptions);
                        oActionForm.dialog(oFormOptions);
                        oActionForm.data("action-options", oTableAction);

                        var oActionFormLink = $(".table-action-" + sAction);
                        if (oActionFormLink.length !== 0) {

                            oActionFormLink.live("click", function () {


                                var sClass = this.className;
                                var classList = sClass.split(/\s+/);
                                var sActionFormId = "";
                                var sAction = "";
                                for (i = 0; i < classList.length; i++) {
                                    if (classList[i].indexOf("table-action-") > -1) {
                                        sAction = classList[i].replace("table-action-", "");
                                        sActionFormId = "#form" + sAction;
                                    }
                                }
                                if (sActionFormId === "") {
                                    properties.fnShowError("Cannot find a form with an id " + sActionFormId + " that should be associated to the action - " + sAction, sAction);
                                }

                                var oTableAction = $(sActionFormId).data("action-options");

                                if (oTableAction.sType === "edit") {

                                    //var oTD = ($(this).parents('td'))[0];
                                    var oTR = ($(this).parents('tr'))[0];
                                    fnPopulateFormWithRowCells(oActionForm, oTR);
                                }
                                $(oActionForm).dialog('open');
                            });
                        }

                        oActionForm.submit(function (event) {

                            fnSendFormUpdateRequest(this);
                            return false;

                        });


                        var aActionFormButtons = [];

                        //var oActionSubmitButton = $("#form" + sAction + "Ok", oActionForm);
                        //aActionFormButtons.push(oActionSubmitButton);
                        var oActionFormCancel = $("#form" + sAction + "Cancel", oActionForm);
                        if (oActionFormCancel.length !== 0) {
                            aActionFormButtons.push(oActionFormCancel);
                            oActionFormCancel.click(function () {

                                var oActionForm = $(this).parents("form")[0];
                                //Clear the validation messages and reset form
                                $(oActionForm).validate().resetForm();  // Clears the validation errors
                                $(oActionForm)[0].reset();

                                $(".error", $(oActionForm)).html("");
                                $(".error", $(oActionForm)).hide();  // Hides the error element
                                $(oActionForm).dialog('close');
                            });
                        }

                        //Convert all action form buttons to the JQuery UI buttons
                        $("button", oActionForm).button();
                        /*
                            if (aActionFormButtons.length > 0) {
                            oActionForm.dialog('option', 'buttons', aActionFormButtons);
                            }
                            */
                    }
                } // end for (var i = 0; i < properties.aoTableActions.length; i++)
            } //end if (properties.aoTableActions !== null)
        });

        /**
         * Updates table row using  form fields after the ajax success callback is
         * executed
         * @param {DOM} nActionForm - Form used to enter data
         */
        function fnUpdateRowOnSuccess(nActionForm) {
            var values = fnTakeRowDataFromFormElements(nActionForm);

            var iRowID = jQuery.data(nActionForm, 'ROWID');
            var oSettings = oTable.fnSettings();
            var iColumnCount = oSettings.aoColumns.length;
            for (var rel = 0; rel < iColumnCount; rel++) {
                if (oSettings.aoColumns !== null &&
                    oSettings.aoColumns[rel] !== null &&
                        isNaN(parseInt(oSettings.aoColumns[0].mDataProp, 10))) {
                    sCellValue = rowData[oSettings.aoColumns[rel].mDataProp];
                } else {
                    sCellValue = values[rel];
                }
                if (sCellValue !== undefined)
                    oTable.fnUpdate(sCellValue, iRowID, rel);
            }

            fnSetDisplayStart();
            $(nActionForm).dialog('close');
            return;

        }

    };
});
/*vim: foldmethod=marker foldmarker={,}: */
