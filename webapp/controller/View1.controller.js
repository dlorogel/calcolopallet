sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/odata/v2/ODataModel',
    'sap/m/SearchField',
    "sap/m/MessageBox",
    "sap/m/Token",
    'sap/ui/model/FilterOperator',
    'sap/ui/model/Filter',
    "../model/formatter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, ODataModel, SearchField, MessageBox, Token, FilterOperator, Filter, formatter) {
        "use strict";

        _smartFilterBar: null;
        _oModel: null;

        return Controller.extend("it.orogel.zcalcolopallet.controller.View1", {
            formatter: formatter,
            onInit: function () {
                //this._oModel = this.getView().getModel('mainService');
                //this.getView().setModel(this._oModel);
                this._smartFilterBar = this.getView().byId("smartFilterBar");
                this.MultiSalesOrderInput = [];
                var fnValidator = function (args) {
                    return new Token({
                        key: args.text,
                        text: args.text
                    });
                };
                this.getView().byId("NumeroOrdineInput").addValidator(fnValidator);
                //sap.ui.core.UIComponent.getRouterFor(this).attachRoutePatternMatched(this._onObjectMatched, this);
            },
            /*_onObjectMatched: function (oEvent) {
                if (this.getOwnerComponent().getRicerca() === "X") {
                    this._oModel = this.getView().getModel('mainService');
                    this.getView().setModel(this._oModel);
                    this.getOwnerComponent().getRicerca("");
                }
            },*/
            onSearch: function () {
                //var aFilters = this.getView().byId("smartFilterBar").getFilters();
                const oFinalFilter = new Filter({
                    filters: [],
                    and: true
                });
                var PosizioniAperteFilter = this.getView().byId("PosizioniAperte").getSelectedKey();
                if (PosizioniAperteFilter !== "") {
                    let aPosizioniAperteFilter = [];
                    if (PosizioniAperteFilter === "1") {
                        aPosizioniAperteFilter.push(new Filter("OutboundDelivery", FilterOperator.EQ, ""));
                        oFinalFilter.aFilters.push(new Filter({
                            filters: aPosizioniAperteFilter,
                            and: false
                        }));
                        aPosizioniAperteFilter.push(new Filter("OutboundDelivery", FilterOperator.EQ, null));
                        oFinalFilter.aFilters.push(new Filter({
                            filters: aPosizioniAperteFilter,
                            and: false
                        }));
                    } else if (PosizioniAperteFilter === "2") {
                        aPosizioniAperteFilter.push(new Filter("OutboundDelivery", FilterOperator.NE, ""));
                        oFinalFilter.aFilters.push(new Filter({
                            filters: aPosizioniAperteFilter,
                            and: false
                        }));
                        aPosizioniAperteFilter.push(new Filter("OutboundDelivery", FilterOperator.NE, null));
                        oFinalFilter.aFilters.push(new Filter({
                            filters: aPosizioniAperteFilter,
                            and: false
                        }));
                    }
                }
                if (this.DataInput !== undefined && this.DataInput !== "" && !(isNaN(this.DataInput))) {
                    let aDataInputFilter = [];
                    debugger;
                    aDataInputFilter.push(new Filter("RequestedDeliveryDate", FilterOperator.EQ, this.DataInput));
                    oFinalFilter.aFilters.push(new Filter({
                        filters: aDataInputFilter,
                        and: false
                    }));
                }
                var MultiSalesOrderInput = this.getView().byId("NumeroOrdineInput").getTokens();
                if (MultiSalesOrderInput.length > 0 && MultiSalesOrderInput) {
                    let aMultiSalesOrderFilter = [];
                    MultiSalesOrderInput.forEach(t => {
                        aMultiSalesOrderFilter.push(new Filter("SalesOrder", FilterOperator.EQ, t.getProperty("text")));
                    });
                    oFinalFilter.aFilters.push(new Filter({
                        filters: aMultiSalesOrderFilter,
                        and: false
                    }));
                    let aQtyFilter = [];
                    aQtyFilter.push(new Filter("ConfdOrderQtyByMatlAvailCheck", FilterOperator.NE, 0));
                    oFinalFilter.aFilters.push(new Filter({
                        filters: aQtyFilter,
                        and: false
                    }));
                    const oReadCDS = new Promise((resolve, reject) => {
                        this.getView().getModel().read("/ZZ1_Calcolo_Pallet_2", {
                            filters: [oFinalFilter],
                            success: (oData) => {
                                resolve(oData.results);
                            },
                            error: (oError) => {
                                reject;
                            }
                        });
                    });
                    oReadCDS.then((aResults) => {
                        aResults.sort((a, b) => this.compareElements(a, b));
                        this.setTableModel(aResults);
                    }, oError => {
                        MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("errorCDS"));
                    });
                } else {
                    MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("errorSalesOrder"));
                }

            },
            compareElements: function (a, b) {
                if (Number(a.SalesOrder) > Number(b.SalesOrder)) {
                    return 1;
                } else if (Number(a.SalesOrder) === Number(b.SalesOrder)) {
                    if (Number(a.SalesOrderItem) > Number(b.SalesOrderItem)) {
                        return 1;
                    } else if (Number(a.SalesOrderItem) === Number(b.SalesOrderItem)) {
                        if (Number(a.ScheduleLine) > Number(b.ScheduleLine)) {
                            return 1;
                        } else {
                            return -1;
                        }
                    } else {
                        return -1;
                    }
                } else {
                    return -1;
                }
            },
            //onBeforeRendering: function () {
            //    /**Set oData model**/
            //    this._ODataServices = this.getView().getModel('palletService');
            //},

            DataChange: function (oEvent) {
                this.DataInput = this.getView().byId("DataRichiesta").getValue();
                var dateParts = this.DataInput.split("/");
                var date = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
                this.DataInput = new Date(date);
                let timezone = this.DataInput.getTimezoneOffset() / 60;
                this.DataInput.setHours(this.DataInput.getHours() - timezone);
            },

            onReset: function () {
                this.getView().byId("DataRichiesta").setValue("");
                this.DataInput = "";
                this.getView().byId("PosizioniAperte").setValue("");
                this.getView().byId("PosizioniAperte").setSelectedKey("")
                this.getView().byId("NumeroOrdineInput").removeAllTokens();
            },

            //onBeforeRebindTable: function (oEvent) {

            //var mBindingParams = oEvent.getParameter("bindingParams");
            //mBindingParams.parameters["expand"] = "to_SalesOrder,to_ScheduleLine";

            //},

            /*onExit: function () {
                debugger;
                if (this._oModel) {
                    this._oModel.destroy();
                    this._oModel = null;
                }
            },*/
            setTableModel: function (aResults) {
                //set model: concat new batch of data to previous model
                const oAppModel = this.getView().getModel("appModel");
                const oTable = this.getView().byId("TabellaOrdini");
                oAppModel.setProperty("/ordini", aResults);
                oTable.setModel(oAppModel);
                oTable.bindRows("/ordini");
                oTable.sort(oTable.getColumns()[0]);
                oAppModel.refresh(true);
            },
            onToPage2: function () {
                var gettingInternalTable = this.getView().byId("TabellaOrdini"),
                    gettingAllRows = gettingInternalTable.getRows();
                var oSelIndices = gettingInternalTable.getSelectedIndices();
                var row = null;
                var shipTo = null;
                var soldTo = null;
                var distributionChannel = null;
                var salesOrganization = null;
                var organizationDivision = null;
                var salesOrderType = null;
                var requestedDeliveryDate = null;
                var err = false;
                var warning1 = false;
                var warning2 = false;
                var buttonConsegna = true;
                var selectedItems = {};
                selectedItems.items = [];
                var item = {};
                const selectedModel = this.getView().getModel("selectedModel");
                const palletListDataModel = this.getView().getModel("palletListDataModel");
                //Get all selected index
                if (oSelIndices !== undefined && oSelIndices.length > 0) {
                    for (var i of oSelIndices) {
                        console.log(i);
                        //console.log(gettingAllRows[i].getBindingContext().getObject())
                        //row = gettingAllRows[i].getBindingContext().getObject();
                        row = gettingInternalTable.getContextByIndex(i);
                        if (row.getProperty("OutboundDelivery") !== "") {
                            buttonConsegna = false;
                        }
                        //if (i == 0) {
                        if (selectedItems.items.length === 0) {
                            shipTo = row.getProperty("ShipToParty");
                            soldTo = row.getProperty("SoldToParty");
                            salesOrganization = row.getProperty("SalesOrganization");
                            distributionChannel = row.getProperty("DistributionChannel");
                            organizationDivision = row.getProperty("OrganizationDivision");
                            salesOrderType = row.getProperty("SalesOrderType");
                            requestedDeliveryDate = row.getProperty("RequestedDeliveryDate");
                            item.shipTo = shipTo;
                            item.soldTo = soldTo;
                            item.salesOrganization = salesOrganization;
                            item.distributionChannel = distributionChannel;
                            item.salesOrderType = salesOrderType;
                            item.requestedDeliveryDate = requestedDeliveryDate;
                            selectedModel.setProperty("/shipTo", shipTo);
                            selectedModel.setProperty("/soldTo", soldTo);
                            selectedModel.setProperty("/salesOrganization", salesOrganization);
                            selectedModel.setProperty("/distributionChannel", distributionChannel);
                            selectedModel.setProperty("/organizationDivision", organizationDivision);
                            selectedModel.setProperty("/salesOrderType", salesOrderType);
                            //For Packaging Creation start
                            item.SALESORDER = row.getProperty("SalesOrder");
                            item.SALESORDERITEM = row.getProperty("SalesOrderItem");
                            //item.OPENQTY = row.getProperty("DeliveredQtyInOrderQtyUnit");
                            item.OPENQTY = row.getProperty("ConfdOrderQtyByMatlAvailCheck");
                            item.UOM = row.getProperty("OrderQuantityUnit");
                            //For Packaging Creation ends
                            console.log(item);
                            selectedItems.items.push(JSON.parse(JSON.stringify(item)));
                        } else {
                            if (shipTo !== row.getProperty("ShipToParty")) {
                                MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("errorShipTo"));
                                err = true;
                                break;
                            }
                            if (soldTo !== row.getProperty("SoldToParty")) {
                                MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("errorSoldTo"));
                                err = true;
                                break;
                            }
                            if (salesOrganization !== row.getProperty("SalesOrganization") &&
                                distributionChannel !== row.getProperty("DistributionChannel") &&
                                organizationDivision !== row.getProperty("OrganizationDivision")) {
                                MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("errorArea"));
                                err = true;
                                break;
                            }
                            if (salesOrderType !== row.getProperty("SalesOrderType")) {
                                warning1 = true;
                            }
                            if (requestedDeliveryDate.getTime() !== row.getProperty("RequestedDeliveryDate").getTime()) {
                                warning2 = true;
                            }
                            if (err !== true) {
                                item.shipTo = shipTo;
                                item.soldTo = soldTo;
                                item.salesOrganization = salesOrganization;
                                item.distributionChannel = distributionChannel;
                                item.salesOrderType = salesOrderType;
                                item.requestedDeliveryDate = requestedDeliveryDate;
                                //For Packaging Creation start
                                item.SALESORDER = row.getProperty("SalesOrder");
                                item.SALESORDERITEM = row.getProperty("SalesOrderItem");
                                //item.OPENQTY = row.getProperty("DeliveredQtyInOrderQtyUnit");
                                item.OPENQTY = row.getProperty("ConfdOrderQtyByMatlAvailCheck");
                                item.UOM = row.getProperty("OrderQuantityUnit");
                                //For Packaging Creation ends
                                var trovato = selectedItems.items.find(x => x.SALESORDER === item.SALESORDER && x.SALESORDERITEM === item.SALESORDERITEM);
                                if (trovato === undefined) {
                                    selectedItems.items.push(JSON.parse(JSON.stringify(item)));
                                } else {
                                    trovato.OPENQTY = parseInt(trovato.OPENQTY) + parseInt(item.OPENQTY);
                                }
                            }
                        }
                    }
                    //Navigate next page

                    var that = this;
                    if (buttonConsegna) {
                        selectedModel.setProperty("/enableButton", true);
                    } else {
                        selectedModel.setProperty("/enableButton", false);
                    }
                    if (warning1 == true && err != true) {
                        MessageBox.warning(this.getView().getModel("i18n").getResourceBundle().getText("warningTypeDoc"),
                            {
                                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                                emphasizedAction: MessageBox.Action.OK,
                                onClose: function (sAction) {
                                    console.log("Action selected: " + sAction);
                                    if (sAction == 'OK') {
                                        //create filters
                                        const aFilters = [];
                                        const customerModel = that.getView().getModel("customerModel");
                                        aFilters.push(new Filter("KUNNR", FilterOperator.EQ, shipTo));
                                        aFilters.push(new Filter("VKORG", FilterOperator.EQ, salesOrganization));
                                        aFilters.push(new Filter("VTWEG", FilterOperator.EQ, distributionChannel));
                                        aFilters.push(new Filter("SPART", FilterOperator.EQ, organizationDivision));

                                        that.getView().getModel('palletService').read("/CustomerInfoSet", {
                                            filters: [new Filter(aFilters, true)],
                                            success: (oData) => {

                                                if (typeof oData.results !== 'undefined' && oData.results.length > 0) {
                                                    customerModel.setData(oData);
                                                    that.getView().setModel(customerModel, "customerModel");
                                                    customerModel.refresh();
                                                }
                                            },
                                            error: (oData) => {
                                                /*this._oComponent.busy(false);
                                                //message
                                                this._oComponent.generateMessageDialog(
                                                    oData.message,
                                                    this._oComponent.i18n().getText('titleErrorConnection'),
                                                    ValueState.Error,
                                                    this._oComponent.i18n().getText('closeButton')
                                                ); */

                                            }
                                        }); //end oData Call Customer info
                                        palletListDataModel.setProperty("/items", selectedItems);
                                        that.getView().setModel(palletListDataModel, "palletListDataModel");
                                        that.getOwnerComponent().getRouter().navTo("TargetView2");
                                    }
                                }
                            }
                        );
                        //this.getOwnerComponent().getRouter().navTo("TargetView2");
                    }


                    if (warning2 == true && err != true) {

                        MessageBox.warning(this.getView().getModel("i18n").getResourceBundle().getText("warningReqDate"),
                            {
                                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                                emphasizedAction: MessageBox.Action.OK,
                                onClose: function (sAction) {
                                    console.log("Action selected: " + sAction);
                                    if (sAction == 'OK') {
                                        //create filters
                                        const aFilters = [];
                                        const customerModel = that.getView().getModel("customerModel");
                                        aFilters.push(new Filter("KUNNR", FilterOperator.EQ, shipTo));
                                        aFilters.push(new Filter("VKORG", FilterOperator.EQ, salesOrganization));
                                        aFilters.push(new Filter("VTWEG", FilterOperator.EQ, distributionChannel));
                                        aFilters.push(new Filter("SPART", FilterOperator.EQ, organizationDivision));

                                        that.getView().getModel('palletService').read("/CustomerInfoSet", {
                                            filters: [new Filter(aFilters, true)],
                                            success: (oData) => {

                                                if (typeof oData.results !== 'undefined' && oData.results.length > 0) {
                                                    customerModel.setData(oData);
                                                    that.getView().setModel(customerModel, "customerModel");
                                                    customerModel.refresh();
                                                }
                                            },
                                            error: (oData) => {
                                                /*this._oComponent.busy(false);
                                                //message
                                                this._oComponent.generateMessageDialog(
                                                    oData.message,
                                                    this._oComponent.i18n().getText('titleErrorConnection'),
                                                    ValueState.Error,
                                                    this._oComponent.i18n().getText('closeButton')
                                                ); */

                                            }
                                        }); //end oData Call Customer info
                                        palletListDataModel.setProperty("/items", selectedItems);
                                        that.getView().setModel(palletListDataModel, "palletListDataModel");
                                        that.getOwnerComponent().getRouter().navTo("TargetView2");
                                    }
                                }
                            }
                        );
                        //this.getOwnerComponent().getRouter().navTo("TargetView2");
                    }

                    if (err == false && warning1 == false && warning2 == false) {
                        debugger;
                        palletListDataModel.setProperty("/items", selectedItems);
                        that.getView().setModel(palletListDataModel, "palletListDataModel");
                        that.getOwnerComponent().getRouter().navTo("TargetView2");
                    }

                } else {
                    // Error Message
                    MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("error"));
                }
            },
        });
    });
