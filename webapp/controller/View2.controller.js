sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/odata/v2/ODataModel',
    'sap/m/SearchField',
    "sap/ui/core/routing/History",
    "sap/m/MessageBox"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, ODataModel, SearchField, History, MessageBox) {
        "use strict";

        _smartFilterBar: null;
        _oModel: null;

        return Controller.extend("it.orogel.zcalcolopallet.controller.View2", {
            onInit: function () {
                //this._oModel = this.getView().getModel('mainService')
                //this.getView().setModel(this._oModel);
            },

            /*onExit: function () {
                if (this._oModel) {
                    this._oModel.destroy();
                    this._oModel = null;
                }
            },*/

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
                var items = this.getView().getModel("palletListDataModel").getProperty("/items");
                console.log(items);

                var requestBody = {};
                var item = {};
                requestBody.KEY = "KEY";
                requestBody.PalletListHeadToItemsNAV = [];

                var index;
                for (index = 0; index < items.items.length; index++) {
                    item.KEY = "KEY";
                    item.SALESORDER = items.items[index].SALESORDER;
                    item.SALESORDERITEM = items.items[index].SALESORDERITEM;
                    item.OPENQTY = items.items[index].OPENQTY;
                    item.UOM = items.items[index].UOM;

                    requestBody.PalletListHeadToItemsNAV.push(item);
                    item = {};
                }

                this.getView().getModel('palletService').create("/PalletListHeadSet", requestBody,
                    {
                        success: (oData) => {
                            console.log(oData);
                            if (typeof oData !== 'undefined') {
                                if (oData.ReturnMessage !== "" || oData.ReturnSuccessMessage !== "") {

                                    if (oData.ReturnSuccessMessage !== "") {
                                        MessageBox.success(this.getView().getModel("i18n").getResourceBundle().getText(oData.ReturnSuccessMessage));
                                    } else {
                                        MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText(oData.RETURNMESSAGE));
                                    }
                                }
                                else { //error during call
                                    MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("internalError"));
                                }
                            } else {
                            }
                        },
                        error: (oData) => {
                            MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("internalError"));

                        }
                    });
            }

        });
    });
