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

    };

});