sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/odata/v2/ODataModel',
    'sap/m/SearchField',
    "sap/ui/core/routing/History",
    "sap/m/MessageBox",
    "../model/formatter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, ODataModel, SearchField, History, MessageBox, formatter) {
        "use strict";

        _smartFilterBar: null;
        _oModel: null;

        return Controller.extend("it.orogel.zcalcolopallet.controller.View2", {
            formatter: formatter,
            onInit: function () {
                //this._oModel = this.getView().getModel('mainService')
                //this.getView().setModel(this._oModel);
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("TargetView2").attachPatternMatched(this._onObjectMatched, this);
                this.oComponent = this.getOwnerComponent();
            },

            /*onExit: function () {
                if (this._oModel) {
                    this._oModel.destroy();
                    this._oModel = null;
                }
            },*/
            _onObjectMatched: function (oEvent) {
                this.setTableModel();
                this.setCheck();
                if (this.getOwnerComponent().getError() && this.getOwnerComponent().getError() !== "") {
                    var Errore = this.getOwnerComponent().getError();
                    Errore = JSON.parse(Errore).ExceptionMessage;
                    MessageBox.error(Errore);
                    this.getOwnerComponent().setError("");
                }
            },
            onNavBack: function () {
                this.getOwnerComponent().setRicerca("X");
                this.getOwnerComponent().getModel().setDefaultCountMode("Request");
                var sPreviousHash = History.getInstance().getPreviousHash();
                //After system update of 23.05.2022 this object doens't work!!
                //oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
                //if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation())
                if (sPreviousHash !== undefined)
                    history.go(-1);
                else {
                    // oCrossAppNavigator.toExternal({
                    // target: {
                    // shellHash: "#Shell-home"
                    // }
                    // });
                    this.getOwnerComponent().getModel().setDefaultCountMode("Request");
                    this.getOwnerComponent().getRouter().navTo("TargetView1");
                }
            },

            onCreateDelivery: function () {
                this.oGlobalBusyDialog = new sap.m.BusyDialog();
                this.oGlobalBusyDialog.open();
                const oAppModel = this.getView().getModel("appModel");
                var CheckPeso = oAppModel.getProperty("/checkPeso");
                var CheckNumMinimoSagome = oAppModel.getProperty("/checkNumMinimoSagome");
                if (CheckPeso === "OK") {
                    if (CheckNumMinimoSagome === "OK") {
                        var items = this.getView().getModel("palletListDataModel").getProperty("/items");
                        console.log(items);
                        var requestBody = {};
                        var item = {};
                        requestBody.KEY = "KEY";
                        requestBody.PalletListHeadToItemsNAV = [];
                        var ItemAPI = [];
                        var index;
                        for (index = 0; index < items.items.length; index++) {
                            item.KEY = "KEY";
                            item.SALESORDER = items.items[index].SALESORDER;
                            item.SALESORDERITEM = items.items[index].SALESORDERITEM;
                            item.OPENQTY = items.items[index].OPENQTY.toString();
                            item.UOM = items.items[index].UOM;
                            if (parseFloat(items.items[index].OPENQTY) < parseFloat(items.items[index].QTYORD)) {
                                ItemAPI.push(item);
                            }
                            requestBody.PalletListHeadToItemsNAV.push(item);
                            item = {};
                        }
                        var that = this;
                        const oPromiseCreate = new Promise((resolve, reject) => {
                            that.getView().getModel('palletService').create("/PalletListHeadSet", requestBody, {
                                success: (aData) => {
                                    resolve(aData);
                                },
                                error: (oError) => {
                                    reject();
                                }
                            });
                        });
                        oPromiseCreate.then((oData) => {
                            if (typeof oData !== 'undefined') {
                                if (oData.ReturnMessage !== "" || oData.ReturnSuccessMessage !== "") {

                                    if (oData.ReturnSuccessMessage !== "") {
                                        /*const oPromisePatch = new Promise((resolve, reject) => {
                                            that.onPatch(resolve, reject, ItemAPI);
                                        });
                                        */
                                        var oPromisePatch = Promise.resolve();
                                        ItemAPI.forEach(y => {
                                            if (oData.PalletListHeadToItemsNAV.results.find(x => x.SALESORDER === y.SALESORDER && x.ERROR !== "X")) {
                                                oPromisePatch = oPromisePatch.then(() => {
                                                    return that.onPatch(y);
                                                });
                                            }
                                        });
                                        oPromisePatch.then(() => {
                                            if (oData.ReturnMessage === "") {
                                                MessageBox.success(that.getView().getModel("i18n").getResourceBundle().getText(oData.ReturnSuccessMessage));
                                                that.oGlobalBusyDialog.close();
                                            } else {
                                                MessageBox.success(that.getView().getModel("i18n").getResourceBundle().getText(oData.ReturnSuccessMessage + "\n" + oData.ReturnMessage));
                                                that.oGlobalBusyDialog.close();
                                            }
                                        }, oError => {
                                            //capire cosa fare in caso di errore
                                            MessageBox.success(that.getView().getModel("i18n").getResourceBundle().getText(oData.ReturnSuccessMessage));
                                            MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText(JSON.parse(oError.responseText).error.message.value));
                                            that.oGlobalBusyDialog.close();
                                        });
                                    } else {
                                        MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText(oData.ReturnMessage));
                                        that.oGlobalBusyDialog.close();
                                    }
                                }
                                else { //error during call
                                    MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("internalError"));
                                    that.oGlobalBusyDialog.close();
                                }
                            } else {
                                that.oGlobalBusyDialog.close();
                            }
                        }, oError => {
                            MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("internalError"));
                            that.oGlobalBusyDialog.close();
                        });
                        /*this.getView().getModel('palletService').create("/PalletListHeadSet", requestBody,
                            {
                                success: (oData) => {
                                    console.log(oData);

                                },
                                error: (oData) => {
                                    that.oGlobalBusyDialog.close();
                                }
                            });*/
                    } else {
                        var that = this;
                        MessageBox.warning(this.getView().getModel("i18n").getResourceBundle().getText("checkNumeroSagome"),
                            {
                                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                                emphasizedAction: MessageBox.Action.OK,
                                onClose: function (sAction) {
                                    console.log("Action selected: " + sAction);
                                    if (sAction == 'OK') {
                                        var items = that.getView().getModel("palletListDataModel").getProperty("/items");
                                        console.log(items);

                                        var requestBody = {};
                                        var item = {};
                                        requestBody.KEY = "KEY";
                                        requestBody.PalletListHeadToItemsNAV = [];
                                        var ItemAPI = [];
                                        var index;
                                        for (index = 0; index < items.items.length; index++) {
                                            item.KEY = "KEY";
                                            item.SALESORDER = items.items[index].SALESORDER;
                                            item.SALESORDERITEM = items.items[index].SALESORDERITEM;
                                            item.OPENQTY = items.items[index].OPENQTY.toString();
                                            item.UOM = items.items[index].UOM;
                                            if (parseFloat(items.items[index].OPENQTY) < parseFloat(items.items[index].QTYORD)) {
                                                ItemAPI.push(item);
                                            }
                                            requestBody.PalletListHeadToItemsNAV.push(item);
                                            item = {};
                                        }

                                        const oPromiseCreate = new Promise((resolve, reject) => {
                                            that.getView().getModel('palletService').create("/PalletListHeadSet", requestBody, {
                                                success: (aData) => {
                                                    resolve(aData);
                                                },
                                                error: (oError) => {
                                                    reject();
                                                }
                                            });
                                        });
                                        oPromiseCreate.then((oData) => {
                                            if (typeof oData !== 'undefined') {
                                                if (oData.ReturnMessage !== "" || oData.ReturnSuccessMessage !== "") {

                                                    if (oData.ReturnSuccessMessage !== "") {
                                                        /*const oPromisePatch = new Promise((resolve, reject) => {
                                                            that.onPatch(resolve, reject, ItemAPI);
                                                        });
                                                        */
                                                        var oPromisePatch = Promise.resolve();
                                                        ItemAPI.forEach(y => {
                                                            if (oData.PalletListHeadToItemsNAV.results.find(x => x.SALESORDER === y.SALESORDER && x.ERROR !== "X")) {
                                                                oPromisePatch = oPromisePatch.then(() => {
                                                                    return that.onPatch(y);
                                                                });
                                                            }
                                                        });
                                                        oPromisePatch.then(() => {
                                                            if (oData.ReturnMessage === "") {
                                                                MessageBox.success(that.getView().getModel("i18n").getResourceBundle().getText(oData.ReturnSuccessMessage));
                                                                that.oGlobalBusyDialog.close();
                                                            } else {
                                                                MessageBox.success(that.getView().getModel("i18n").getResourceBundle().getText(oData.ReturnSuccessMessage + "\n" + oData.ReturnMessage));
                                                                that.oGlobalBusyDialog.close();
                                                            }
                                                        }, oError => {
                                                            //capire cosa fare in caso di errore
                                                            MessageBox.success(that.getView().getModel("i18n").getResourceBundle().getText(oData.ReturnSuccessMessage));
                                                            MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText(JSON.parse(oError.responseText).error.message.value));
                                                            that.oGlobalBusyDialog.close();
                                                        });
                                                    } else {
                                                        MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText(oData.ReturnMessage));
                                                        that.oGlobalBusyDialog.close();
                                                    }
                                                }
                                                else { //error during call
                                                    MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("internalError"));
                                                    that.oGlobalBusyDialog.close();
                                                }
                                            } else {
                                                that.oGlobalBusyDialog.close();
                                            }
                                        }, oError => {
                                            MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("internalError"));
                                            that.oGlobalBusyDialog.close();
                                        });
                                    }
                                }
                            }
                        );
                    }
                } else {
                    MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("PesoKO"));
                }
            },
            setTableModel: function () {
                var oPalleListDataModel = this.getView().getModel("palletListDataModel");
                const oTable = this.getView().byId("TabellaPallet");
                var Item = this.getView().getModel("palletListDataModel").getProperty("/WMS");
                var aPallet = [];
                if (Item) {
                    if (Item.Posizioni) {
                        Item.Posizioni.forEach(x => {
                            var oPallet = JSON.parse(JSON.stringify(x));
                            if (oPallet.Pallettizzazioni.length > 0) {
                                oPallet.enablePalletization = true;
                            }
                            aPallet.push(oPallet);
                        });
                        const oAppModel = this.getView().getModel("appModel");
                        oAppModel.setProperty("/pallet", aPallet);
                        oTable.setModel(oAppModel);
                        oTable.bindRows("/pallet");
                        oTable.sort(oTable.getColumns()[0]);
                        oPalleListDataModel.refresh(true);
                    } else {
                        const oAppModel = this.getView().getModel("appModel");
                        oAppModel.setProperty("/pallet", []);
                        oTable.setModel(oAppModel);
                        oTable.bindRows("/pallet");
                        oTable.sort(oTable.getColumns()[0]);
                        oPalleListDataModel.refresh(true);
                    }
                }
            },
            setCheck: function () {
                const oAppModel = this.getView().getModel("appModel");
                const oCustomerModel = this.getView().getModel("customerModel");
                const palletListDataModel = this.getView().getModel("palletListDataModel");
                var ZZ1_MIN_SAGOME = parseFloat(oCustomerModel.getProperty("/results")[0].ZZ1_MIN_SAGOME);
                var NumSagome = parseFloat(palletListDataModel.getProperty("/WMS").NumSagome);
                var TotPeso = parseFloat(palletListDataModel.getProperty("/WMS").TotPeso);
                if (NumSagome >= ZZ1_MIN_SAGOME) {
                    oAppModel.setProperty("/checkNumMinimoSagome", "OK");
                } else {
                    oAppModel.setProperty("/checkNumMinimoSagome", "KO");
                }
                if (TotPeso > 25000) {
                    oAppModel.setProperty("/checkPeso", "KO");
                } else {
                    oAppModel.setProperty("/checkPeso", "OK");
                }
            },
            onOpenPalletization: function (oEvent) {
                let oRow = oEvent.getSource().getBindingContext().getObject();
                this.getView().getModel("detailModel").setData(oRow);
                const oAppModel = this.getView().getModel("appModel");
                oAppModel.setProperty("/NamePallet", oRow.PalletNumero);
                this._createDialog(oRow);
            },
            onAfterCloseDialog: function (oEvent) {
                this.oDialog.destroy();
                this.oDialog = null;
            },
            onCloseDialog: function () {
                this.oDialog.close();
            },
            _createDialog: function (oRow) {
                if (this.oDialog === undefined || this.oDialog === null) {
                    this.oDialog = sap.ui.xmlfragment("it.orogel.zcalcolopallet.view.Detail", this);
                    this.getView().addDependent(this.oDialog);
                }
                this.oDialog.open();
                this.setTableModelDetail(oRow);
                this.oDialog.setModel(this.getView().getModel("detailModel"));
            },
            setTableModelDetail: function (oRow) {
                const oTable = sap.ui.getCore().byId("TabellaPallettizzazione");
                const oAppModel = this.getView().getModel("appModel");
                oAppModel.setProperty("/pallettizzazione", oRow.Pallettizzazioni);
                oTable.setModel(oAppModel);
                oTable.bindRows("/pallettizzazione");
                oTable.sort(oTable.getColumns()[0]);
                oAppModel.refresh(true);
            },
            onPatch: function (oAPIData) {
                /*var batchChanges = [];
                var sServiceUrl = "/sap/opu/odata/sap/API_SALES_ORDER_SRV/";
                var oDataModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
                if (aAPIData.length === 0) {
                    resolve();
                } else {
                    aAPIData.forEach(x => {
                        var ModifyString = "A_SalesOrderItem(SalesOrder='" + x.SALESORDER + "',SalesOrderItem='" + x.SALESORDERITEM + "')";
                        var ObjectPatch = {};
                        ObjectPatch.SalesDocumentRjcnReason = "Z1";
                        batchChanges.push(oDataModel.createBatchOperation(encodeURIComponent(ModifyString), "PATCH", ObjectPatch));
                    });
                    oDataModel.addBatchChangeOperations(batchChanges);
                    oDataModel.submitBatch(function (data, responseProcess) {
                        //sap.m.MessageToast.show("Successo");
                        resolve();
                    }.bind(this),
                        function (err) {
                            //sap.m.MessageToast.show("Errore");
                            reject();
                        });
                }*/
                var ObjectPatch = {};
                ObjectPatch.SalesDocumentRjcnReason = "Z1";
                return new Promise((resolve, reject) => {
                    this.getView().getModel("SalesOrderModel").update("/A_SalesOrderItem(SalesOrder='" + oAPIData.SALESORDER + "',SalesOrderItem='" + oAPIData.SALESORDERITEM + "')", ObjectPatch, {
                        success: oData => {
                            resolve();
                        },
                        error: (oError) => {
                            reject(oError);
                        }
                    }, [], true);
                });
            }

        });
    });

