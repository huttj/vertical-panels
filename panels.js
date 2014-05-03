$.panels = (function($, window, document, undefined) {
    var containerID = '#panels-container',
        wrapperID = '#panels-wrapper',
        panelClass = '.panel',
        container, // Container that holds the wrapper
        wrapper, // Wrapper that contains the panels
        panels, // jQuery-wrapped array of the panels
        columns, // An array of the panels, grouped by column
        margin = {}, // Stores margin.top and margin.left of the first panel in the lists
        wrapperHeight, // The current height of the wrapper
        lastHeight, // The previous height of the wrapper
        initialized = false,
        allWidth = 0, // The grand total width of all of the panels (and their margins)
        groupedWidth, // The width of the current columnized layout
        lastGroupedWidth, // The previous width of the columnized layout
        resizing, // setTimeout that handles the onResize delay
        delay = 333, // setting for how long to wait before reflowing after resize
        duration = 500, // how long each reflow should take (ms)
        resizeTimeout; // The timeout to delay the resizing of the wrapper

    var init = function(options) {
        containerID = options.containerID || containerID;
        wrapperID = options.wrapperID || wrapperID;
        panelClass = options.panelClass || panelClass;

        container = $(containerID);
        wrapper = $(wrapperID);
        panels = $(containerID).find(wrapperID).find(panelClass); // Endure that the panels are located properly

        // If the mousewheel plugin is supplied, use it
        if ($().mousewheel) {
            container.mousewheel(function(e, delta) {
                if (Math.abs(e.deltaX)) {
                    this.scrollLeft -= (e.deltaX * 100);
                } else {
                    this.scrollLeft -= (e.deltaY * 100);
                }
                e.preventDefault();
            });
        }

        // TODO Fix CSS of panels -- should be display: block; float: left; transition: margin 500ms ease;
        // and make sure the wrapper and container are have the right CSS
        // use duration

        // Ensure that panels and wrapper are found
        if (!panels.length && !wrapper.lenth) throw ['Panels could not be initialized.', panels, wrapper].join(' ');

        margin.top = parseInt($(panelClass).css('margin-top'));
        margin.left = parseInt($(panelClass).css('margin-left'));

        // Set data to be used in relayout
        panels.each(function() {
            $(this).data('height', $(this).height())
                .data('width', $(this).width());
            allWidth += $(this).data('width') + (margin.left * 2);
            // Reset margins
            $(this).css({
                marginRight: 0,
                marginBottom: 0,
            });
        });

        lastHeight = wrapper.height() - margin.top;

        updateOnResize(options.onResize || options.onResize === undefined);
        return initialized = true;
    }

    // Go through the list of panels and group them into colums with a total height
    // of equal or less than the wrapper. Fits as many panels as possible into each
    // column, each of which is an array.
    // Return: False if the wrapper height has not changed, or if the new columns
    //         are all the same length of the pregrouping is the same
    var panelsToColumns = function() {
        if (wrapper.height() === wrapperHeight - margin.top) {
            return false;
        } else {
            wrapperHeight = wrapper.height() - margin.top;
        }

        var newCols = [];
        var layoutWidth = margin.left,
            currentWidth = 0,
            lastGroupedWidth = 0;

        // Need a holder for each column and a way to track the amassed height
        for (var i = 0, currentGroup = [], runningHeight = 0, panelLength = panels.length; i < panelLength; i++) {

            if ($(panels[i]).data('height') + margin.top + runningHeight > wrapperHeight && i > 0) { // not on the first one
                // we're done here, push the column and clear our holders
                newCols.push(currentGroup);
                layoutWidth += currentWidth;
                currentGroup = [];
                runningHeight = 0;
                currentWidth = 0;
            }

            currentGroup.push(panels[i]);
            runningHeight += $(panels[i]).data('height') + margin.top;

            var panelWidth = $(panels[i]).data('width') + (margin.left) // Calculate the width of the current panel
            if (panelWidth > currentWidth) currentWidth = panelWidth; // Take the widest panel in the current column
        }
        layoutWidth += currentWidth; // For the last panel
        newCols.push(currentGroup);

        // This compares the stored columns and the new newCols, column by column,
        // to see if the elements are changed, returns true if they are changed,
        // and false if they are not.
        // If there are the same number of columns, the layout might be the same
        if (columns && columns.length === newCols.length) {
            for (var j = 0; j < columns.length; j++) {
                if (columns[j].length !== newCols[j].length) return columns = newCols, lastGroupedWidth = groupedWidth, groupedWidth = layoutWidth; // If the column has a different number of panels, layout is changed
            }
        } else {
            return columns = newCols, lastGroupedWidth = groupedWidth, groupedWidth = layoutWidth;
        }
        return false; // There is no previous columns array built, or the new and old ones are the same
    }

    var colWidth = function(column) {
        var width = 0;
        for (var i = 0, columnLength = column.length; i < columnLength; i++) {
            if ($(column[i]).data('width') > width) width = $(column[i]).data('width');
        };
        return width + margin.left;
    }

    // Redo the layout of the panels
    var doLayout = function() {

        clearTimeout(resizeTimeout);

        // No combination of these seemed to keep it from flickering
        // var tempWidth = Math.max(lastGroupedWidth, groupedWidth);
        // tempWidth     = Math.min(allWidth, tempWidth * 2);
        wrapper.width(allWidth); // Give the panels enough space to keep them from jumping to the next row

        resizeTimeout = setTimeout(function() {
            wrapper.animate({
                'width': groupedWidth
            }, duration);
        }, duration / 2) // Delays the resize wrt. the proportion of the full width

        for (var i = 0, columnsLength = columns.length; i < columnsLength; i++) {

            // $(columns[i][0]).animate({
            //     'margin-top': margin.top,
            //     'margin-left': margin.left
            // }, duration);

            $(columns[i][0]).animate({
                marginTop: margin.top,
                marginLeft: margin.left
            }, duration);

            var prevTopMargin = 0 // margin.top; again, to make the inner margins match the top and left margins
            var prevLeftMargin = margin.left;
            for (var j = 1, columnLength = columns[i].length; j < columnLength; j++) {


                var thisPanelWidth = $(columns[i][j]).data('width') + (margin.left * 2);

                var thisTopMargin = $(columns[i][j - 1]).data('height') + (margin.top * 2) + prevTopMargin;
                var thisLeftMargin = Math.max($(columns[i][j - 1]).data('width'), prevLeftMargin);
                prevTopMargin = thisTopMargin - margin.top;
                prevLeftMargin = thisLeftMargin;

                // $(columns[i][j]).animate({
                //     marginTop: thisTopMargin,
                //     marginLeft: -$(columns[i][j - 1]).data('width') // - (margin.left) // this is not needed if the panel-inner margin is to match the margin it makes with the wrapper
                // }, duration);

                $(columns[i][j]).animate({
                    marginTop: thisTopMargin,
                    marginLeft: -thisLeftMargin
                }, duration);
            }
        }
    };

    var updateOnResize = function() {
        $(window).resize(function() {
            clearTimeout(resizing);
            resizing = setTimeout(function() {
                if (panelsToColumns()) {

                    doLayout();
                    lastHeight = wrapperHeight;
                }
            }, delay);
        });
    };

    // Options is an initializer object with the following optional parameters
    //    containerID:    a hash-prefixed string specifying the ID of the panels continer
    //    wrapperID:      same as above, but for the wrapper
    //    panelClass:     class name for the panels
    //    reinitialize:   whether or not to throw out the stored data and refresh
    //    onResize:       whether or not to update the layout on resize
    //    delay:    how long to wait after resize starts to redo the layout
    //    duration: how long each element should take to move into place
    // TODO: Use $.fn.extend() and make this callable on the container
    return function(options) {
        if (!initialized || (options.hasOwnProperty('reinitialize') && options.reinitialize)) init(options);

        if (panelsToColumns()) {
            doLayout(true);
        }
        return $;
    }

})(jQuery, window, document);
