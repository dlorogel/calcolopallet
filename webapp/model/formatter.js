sap.ui.define([], function () {

    "use strict";

    return {

        fmFormatDate: function (date) {
            if (!date) return "";
            var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                pattern: "dd-MM-yyyy"
            });
            return dateFormat.format(new Date(date));
        },
        fmNumber: function (number) {
            if (!number) return "";
            return parseInt(number).toString();
        },
        fmIconChange: function (Misto) {
            if (Misto) {
                return "sap-icon://accept";
            } else {
                //return "sap-icon://error";
                return "";
            }
        }

    };

});