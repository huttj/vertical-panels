var Panels = (function(document, window, undefined) {
    var panelsWrapper,
        panels,
        margin = 10,
        columns,
        wrapperHeight;

    var getPanels = function() {
        panelsWrapper = $('#PanelsContainer').find('#PanelsWrapper');
        panels = $('#PanelsWrapper').find('.Panel');
        margin = parseInt($('.Panel').css('margin-top'));

        if (!panels.length + !panelsWrapper.length) {
            throw 'Required element(s) missing';
        }
        wrapperHeight = panelsWrapper.height();
    };

    function panelsToCols() {
        var frameHeight = panelsWrapper.height() - margin;
        var cols = [];

        // Need a holder for each column
        // And a way to track the amassed height
        var currentGroup = [];
        var runningHeight = 0;
        for (var i = 0; i < panels.length; i++) {
            if ($(panels[i]).outerHeight() + runningHeight > frameHeight) {
                // we're done here, push the column and clear our holders
                cols.push(currentGroup);
                currentGroup = [];
                runningHeight = 0;
            }
            currentGroup.push(panels[i]);
            runningHeight += $(panels[i]).outerHeight() + margin * 2;
        }
        cols.push(currentGroup);

        // This compares the stored columns and the new cols, column by column,
        // to see if the elements are changed, returns true if they are changed,
        // and false if they are not.
        // If there are the same number of columns, the layout might be the same
        if (columns && columns.length === cols.length) {
            for (var j = 0; j < columns.length; j++) {
                // If the column has the same number of panels, layout might be unchanged
                if (columns[j].length === cols[j].length) {
                    for (var k = 1; k < columns.length; k++) {
                        // If any of the elements are different, the layout has changed
                        // This should probably never be an issue, as a change in the
                        // column entries at the beginning would also cause a change
                        // in column length, thur returning false much earlier
                        if (columns[j][k] !== cols[j][k]) {
                            return columns = cols;
                        }
                    }
                } else {
                    return false;
                }
            }
        }
        return columns = cols;
    }

    function doLayout() {
        console.log('relayouting');
        panels.css('visibility', 'hidden');
        $(panels).css({
            'margin-top': margin,
            'margin-left': margin
        });


        // var getColWidth = function(col) {
        //     var colWidth = 0;
        //     for (var i = 0; i < col.length; i++) {
        //         colWidth = colWidth > $(col[i]).outerWidth ? colWidth : $(col[i]).outerWidth;
        //     }
        // };

        var width = 0;
        var cols = columns;
        for (var i = 0; i < cols.length; i++) {
            var colWidth = $(cols[i][0]).outerWidth();
            for (var j = 1; j < cols[i].length; j++) {
                colWidth = colWidth > $(cols[i][j]).outerWidth() ? colWidth : $(cols[i][j]).outerWidth();
                $(cols[i][j]).css({
                    'margin-top': $(cols[i][j - 1]).outerHeight() + (2 * margin) + parseInt($(cols[i][j - 1]).css('margin-top')),
                    'margin-left': -$(cols[i][j - 1]).outerWidth() - margin
                });
            }
            width += colWidth + margin * 2;
        }
        console.log
        panelsWrapper.width(width);
        panels.css('visibility', 'visible');
    }

    $(window).resize(function() {
        var oldWrapperHeight = wrapperHeight;
        // wrapper height different? do panelsToCols()
        // layout changed? update layout()
        getPanels();
        if (panelsToCols()) {
            doLayout();
        }
    });

    $('#PanelsContainer').mousewheel(function(e, delta) {

        if (Math.abs(e.deltaX)) {
            this.scrollLeft -= (e.deltaX * 100);
        } else {
            this.scrollLeft -= (e.deltaY * 100);
        }

        e.preventDefault();
    });

    return {
        getPanels: getPanels,
        panelsToCols: panelsToCols,
        runAll: function() {
            getPanels();
            panelsToCols();
            doLayout();
        }
    };
})(document, window);