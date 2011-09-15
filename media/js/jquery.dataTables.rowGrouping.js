/*
* File:        jquery.dataTables.grouping.js
* Version:     0.1.
* Author:      Jovan Popovic 
* 
* Copyright 2011 Jovan Popovic, all rights reserved.
*
* This source file is free software, under either the GPL v2 license or a
* BSD style license, as supplied with this software.
* 
* This source file is distributed in the hope that it will be useful, but 
* WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY 
* or FITNESS FOR A PARTICULAR PURPOSE. 
* 
*/
(function ($) {

    $.fn.rowGrouping = function (options) {

        function _fnGetYear(x) {
            return x.substr(iYearIndex, 4);
        }
        function _fnGetGroupByName(x) {
            return x;
        }

        function _fnGetGroupByLetter(x) {
            return x.substr(0, 1);
        }

        function _fnGetGroupByYear(x) {
            return _fnGetYear(x);
            //return Date.parseExact(x, properties.sDateFormat).getFullYear();//slooooow
        }

        function _fnGetGroupByYearMonth(x) {
            var date = Date.parseExact(x, "dd/MM/yyyy");
            return date.getFullYear() + " / " + date.getMonthName();
        }

        var oTable = this;
        var iYearIndex = 6;

        var defaults = {

            iGroupingColumnIndex: 0,
            sGroupingColumnSortDirection: "",
            iGroupingOrderByColumnIndex: -1,
            sGrupingClass: "group",
            bHideGroupingColumn: true,
            bHideGroupingOrderByColumn: true,
            sGroupBy: "name",

            sDateFormat: "dd/MM/yyyy",
            sEmptyGroupLabel: "-",
            bSetGroupingClassOnTR: false,

            iGroupingColumnIndex2: -1,
	    sGroupingColumnSortDirection2: "",
	    iGroupingOrderByColumnIndex2: -1,
            sGrupingClass2: "subgroup",
            bHideGroupingColumn2: true,
            bHideGroupingOrderByColumn2: true,
            sGroupBy2: "name",


        };

        properties = $.extend(defaults, options);

        if (properties.iGroupingOrderByColumnIndex == -1) {
            properties.bCustomColumnOrdering = false;
            properties.iGroupingOrderByColumnIndex = properties.iGroupingColumnIndex;
        } else {
            properties.bCustomColumnOrdering = true;
        }

        if (properties.sGroupingColumnSortDirection == "") {
            if (properties.sGroupBy == "year")
                properties.sGroupingColumnSortDirection = "desc";
            else
                properties.sGroupingColumnSortDirection = "asc";
        }


        if (properties.iGroupingOrderByColumnIndex2 == -1) {
            properties.bCustomColumnOrdering2 = false;
            properties.iGroupingOrderByColumnIndex2 = properties.iGroupingColumnIndex2;
        } else {
            properties.bCustomColumnOrdering2 = true;
        }

        if (properties.sGroupingColumnSortDirection2 == "") {
            if (properties.sGroupBy2 == "year")
                properties.sGroupingColumnSortDirection2 = "desc";
            else
                properties.sGroupingColumnSortDirection2 = "asc";
        }

        iYearIndex = properties.sDateFormat.toLowerCase().indexOf('yy');

        var fnGetGroup = _fnGetGroupByName;
        switch (properties.sGroupBy) {
            case "letter": fnGetGroup = _fnGetGroupByLetter;
                break;
            case "year": fnGetGroup = _fnGetGroupByYear;
                break;
            case "month": fnGetGroup = _fnGetGroupByYearMonth;
                break;
            default: fnGetGroup = _fnGetGroupByName;
                break;
        }

        return this.each(function () {


            var _fnDrawCallBackWithGrouping = function (oSettings) {

                var bUseSecondaryGrouping = false;

                if (properties.iGroupingColumnIndex2 != -1)
                    bUseSecondaryGrouping = true;

                //-----Start grouping

                if (oSettings.aiDisplay.length == 0) {
                    return;
                }

                var nTrs = $('tbody tr', oTable);
                var iColspan = nTrs[0].getElementsByTagName('td').length;
                var sLastGroup = null;
                var sLastGroup2 = null;
                for (var i = 0; i < nTrs.length; i++) {
                    var iDisplayIndex = oSettings._iDisplayStart + i;
                    var sGroupData = "";
                    var sGroup = null;
                    var sGroupData2 = "";
                    var sGroup2 = null;

                    sGroupData = oSettings.aoData[oSettings.aiDisplay[iDisplayIndex]]._aData[properties.iGroupingColumnIndex];
                    var sGroup = sGroupData;
                    if (properties.sGroupBy != "year")
                        sGroup = fnGetGroup(sGroupData);

                    if (bUseSecondaryGrouping) {
                        sGroupData2 = oSettings.aoData[oSettings.aiDisplay[iDisplayIndex]]._aData[properties.iGroupingColumnIndex2];
                        if (properties.sGroupBy2 != "year")
                            sGroup2 = fnGetGroup(sGroupData2);
                    }

                    if (sLastGroup == null || sGroup != sLastGroup) {
                        var nGroup = document.createElement('tr');
                        var nCell = document.createElement('td');

                        if (properties.bSetGroupingClassOnTR) {
                            nGroup.className = properties.sGrupingClass + " " + sGroup.toLowerCase().replace(" ", "-");
                        } else {
                            nCell.className = properties.sGrupingClass + " " + sGroup.toLowerCase().replace(" ", "-");
                        }

                        nCell.colSpan = iColspan;
                        nCell.innerHTML = sGroup == "" ? properties.sEmptyGroupLabel : sGroup;

                        nGroup.appendChild(nCell);
                        nTrs[i].parentNode.insertBefore(nGroup, nTrs[i]);
                        sLastGroup = sGroup;
                        sLastGroup2 = null;//to reset second level grouping



                    } // end if (sLastGroup == null || sGroup != sLastGroup)

                    if (bUseSecondaryGrouping) {

                        if (sLastGroup2 == null || sGroup2 != sLastGroup2) {
                            var nGroup2 = document.createElement('tr');
                            var nCell2 = document.createElement('td');

                            if (properties.bSetGroupingClassOnTR) {
                                nGroup2.className = properties.sGrupingClass2 + " " + sGroup2.toLowerCase().replace(" ", "-");
                            } else {
                                nCell2.className = properties.sGrupingClass2 + " " + sGroup2.toLowerCase().replace(" ", "-");
                            }

                            nCell2.colSpan = iColspan;
                            nCell2.innerHTML = sGroup2 == "" ? properties.sEmptyGroupLabel : sGroup2;

                            nGroup2.appendChild(nCell2);
                            nTrs[i].parentNode.insertBefore(nGroup2, nTrs[i]);
                            sLastGroup2 = sGroup2;
                        }


                    } //end if (bUseSecondaryGrouping)


                } // end for (var i = 0; i < nTrs.length; i++)


                //-----End grouping


            };

            oTable.fnSetColumnVis(properties.iGroupingColumnIndex, !properties.bHideGroupingColumn);
            if (properties.bCustomColumnOrdering) {
                oTable.fnSetColumnVis(properties.iGroupingOrderByColumnIndex, !properties.bHideGroupingOrderByColumn);
            }
            if (properties.iGroupingColumnIndex2 != -1) {
                oTable.fnSetColumnVis(properties.iGroupingColumnIndex2, !properties.bHideGroupingColumn2);
            }
            if (properties.bCustomColumnOrdering2) {
                oTable.fnSetColumnVis(properties.iGroupingOrderByColumnIndex2, !properties.bHideGroupingOrderByColumn2);
            }
            oTable.fnSettings().aoDrawCallback.push({
                "fn": _fnDrawCallBackWithGrouping,
                "sName": "fnRowGroupung"
            });

	    var aaSortingFixed = new Array();
	    aaSortingFixed.push( [properties.iGroupingOrderByColumnIndex, properties.sGroupingColumnSortDirection] );
            if (properties.iGroupingColumnIndex2 != -1) {
                aaSortingFixed.push( [properties.iGroupingOrderByColumnIndex2, properties.sGroupingColumnSortDirection2] );
            }
 
	    oTable.fnSettings().aaSortingFixed = aaSortingFixed;          
	    //Old way
	    //oTable.fnSettings().aaSortingFixed = [[properties.iGroupingOrderByColumnIndex, properties.sGroupingColumnSortDirection]];

            switch (properties.sGroupBy) {
                case "name":
                    break;


                case "letter":

                    /* Create an array with the values of all the input boxes in a column */
                    oTable.fnSettings().aoColumns[properties.iGroupingOrderByColumnIndex].sSortDataType = "rg-letter";
                    $.fn.dataTableExt.afnSortData['rg-letter'] = function (oSettings, iColumn) {
                        var aData = [];
                        $('td:eq(' + iColumn + ')', oSettings.oApi._fnGetTrNodes(oSettings)).each(function () {
                            aData.push(_fnGetGroupByLetter(this.innerHTML));
                        });
                        return aData;
                    }


                    break;


                case "year":


                    /* Create an array with the values of all the input boxes in a column */
                    oTable.fnSettings().aoColumns[properties.iGroupingOrderByColumnIndex].sSortDataType = "rg-date";
                    $.fn.dataTableExt.afnSortData['rg-date'] = function (oSettings, iColumn) {
                        var aData = [];
                        $('td:eq(' + iColumn + ')', oSettings.oApi._fnGetTrNodes(oSettings)).each(function () {
                            aData.push(_fnGetYear(this.innerHTML));
                        });
                        return aData;
                    }




                    break;
                default:
                    break;

            }
            if (properties.sGroupBy == "name" || properties.sGroupBy == "letter") {

            } else {
                //oTable.fnSettings().aaSortingFixed = [[properties.iGroupingOrderByColumnIndex, properties.sGroupingColumnSortDirection]];

            }

            oTable.fnDraw();


        });
    };
})(jQuery);