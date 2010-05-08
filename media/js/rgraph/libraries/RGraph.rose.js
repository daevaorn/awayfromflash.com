    /**
    * o------------------------------------------------------------------------------o
    * | This file is part of the RGraph package - you can learn more at:             |
    * |                                                                              |
    * |                          http://www.rgraph.net                               |
    * |                                                                              |
    * | This package is licensed under the RGraph license. For all kinds of business |
    * | purposes there is a small one-time licensing fee to pay and for non          |
    * | commercial  purposes it is free to use. You can read the full license here:  |
    * |                                                                              |
    * |                      http://www.rgraph.net/LICENSE.txt                       |
    * o------------------------------------------------------------------------------o
    */
    
    if (typeof(RGraph) == 'undefined') RGraph = {};
    
    /**
    * The rose chart constuctor
    * 
    * @param object canvas
    * @param array data
    */
    RGraph.Rose = function (id, data)
    {
        this.id         = id;
        this.canvas     = document.getElementById(id);
        this.context    = this.canvas.getContext('2d');
        this.data       = data;
        this.canvas.__object__ = this;
        this.type              = 'rose';


        /**
        * Compatibility with older browsers
        */
        RGraph.OldBrowserCompat(this.context);


        this.centerx = 0;
        this.centery = 0;
        this.radius  = 0;

        this.max     = 0;
        
        this.properties = {
            'chart.colors':                 ['rgb(255,0,0)', 'rgb(0,255,255)', 'rgb(0,255,0)', 'rgb(127,127,127)', 'rgb(0,0,255)', 'rgb(255,128,255)'],
            'chart.colors.alpha':           null,
            'chart.gutter':                 25,
            'chart.title':                  '',
            'chart.title.vpos':             null,
            'chart.labels':                 null,
            'chart.labels.axes':            'nsew',
            'chart.text.color':             'black',
            'chart.text.font':              'Verdana',
            'chart.text.size':              10,
            'chart.key':                    null,
            'chart.key.shadow':             false,
            'chart.key.background':         'white',
            'chart.key.position':           'graph',
            'chart.contextmenu':            null,
            'chart.tooltips':               null,
            'chart.tooltips.effect':         'fade',
            'chart.tooltips.css.class':      'RGraph_tooltip',
            'chart.annotatable':            false,
            'chart.annotate.color':         'black',
            'chart.zoom.factor':            1.5,
            'chart.zoom.fade.in':           true,
            'chart.zoom.fade.out':          true,
            'chart.zoom.hdir':              'right',
            'chart.zoom.vdir':              'down',
            'chart.zoom.frames':            10,
            'chart.zoom.delay':             50,
            'chart.zoom.shadow':            true,
            'chart.zoom.mode':              'canvas',
            'chart.zoom.thumbnail.width':   75,
            'chart.zoom.thumbnail.height':  75,
            'chart.zoom.background':        true,
            'chart.zoom.action':            'zoom',
            'chart.resizable':              false
        }
        
        // Check the common library has been included
        if (typeof(RGraph) == 'undefined') {
            alert('[ROSE] Fatal error: The common library does not appear to have been included');
        }
    }


    /**
    * A simple setter
    * 
    * @param string name  The name of the property to set
    * @param string value The value of the property
    */
    RGraph.Rose.prototype.Set = function (name, value)
    {
        // A bit of BC
        if (name == 'chart.labels') {
            name = 'chart.key';
        }

        this.properties[name.toLowerCase()] = value;
    }
    
    
    /**
    * A simple getter
    * 
    * @param string name The name of the property to get
    */
    RGraph.Rose.prototype.Get = function (name)
    {
        return this.properties[name.toLowerCase()];
    }

    
    /**
    * This method draws the rose chart
    */
    RGraph.Rose.prototype.Draw = function ()
    {
        // Calculate the radius
        this.radius       = (Math.min(this.canvas.width, this.canvas.height) / 2);
        this.centerx      = this.canvas.width / 2;
        this.centery      = this.canvas.height / 2;
        this.angles       = [];
        this.total        = 0;
        this.startRadians = 0;
        
        /**
        * Change the centerx marginally if the key is defined
        */
        if (this.Get('chart.key') && this.Get('chart.key').length > 0 && this.Get('chart.key').length >= 3) {
            this.centerx = this.centerx - this.Get('chart.gutter') + 5;
        }

        this.DrawBackground();
        this.DrawRose();
        this.DrawLabels();

        /**
        * Setup the context menu if required
        */
        if (this.Get('chart.contextmenu')) {
            RGraph.ShowContext(this);
        }

        /**
        * Tooltips
        */
        if (this.Get('chart.tooltips')) {

            /**
            * Register this object for redrawing
            */
            RGraph.Register(this);
        
            /**
            * The onclick event
            */
            this.canvas.onclick = function (e)
            {
                e = RGraph.FixEventObject(e);

                RGraph.Redraw();

                var mouseCoords = RGraph.getMouseXY(e);

                var canvas  = e.target;
                var context = canvas.getContext('2d');
                var obj     = e.target.__object__;
                var r       = e.target.__object__.radius;
                var x       = mouseCoords[0] - obj.centerx;
                var y       = mouseCoords[1] - obj.centery;
                var theta   = Math.atan(y / x); // RADIANS
                var hyp     = theta == 0 ? 0: (y / Math.sin(theta));


                // Put theta in DEGREES
                 theta *= 57.3

                if (!obj.Get('chart.tooltips')) {
                    return;
                }

                hyp = Math.abs(hyp);

                /**
                * Account for the correct quadrant
                */
                if (x < 0 && y > 0) {
                    theta += 180;
                } else if (x <= 0 && y <= 0) {
                    theta += 180;
                } else if (x >= 0 && y < 0) {
                    theta += 360;
                }


                /**
                * The angles for each segment are stored in "angles",
                * so go through that checking if the mouse position corresponds
                */
                theta = parseInt(theta);

                for (i=0; i<obj.angles.length; ++i) {

                    if (theta >= parseInt(obj.angles[i][0]) && theta <= parseInt(obj.angles[i][1]) && hyp <= obj.angles[i][2]) {

                        /**
                        * Get the tooltip text
                        */
                        if (typeof(obj.Get('chart.tooltips')) == 'function') {
                            var text = String(obj.Get('chart.tooltips')(i));
                        
                        } else if (typeof(obj.Get('chart.tooltips')) == 'object' && typeof(obj.Get('chart.tooltips')[i]) == 'function') {
                            var text = obj.Get('chart.tooltips')[i](i);
                        
                        } else if (typeof(obj.Get('chart.tooltips')) == 'object') {
                            var text = String(obj.Get('chart.tooltips')[i]);

                        } else {
                            var text = null;
                        }

                        /**
                        * If a tooltip is defined, show it
                        */
                        if (typeof(text) == 'string') {

                            context.lineWidth = 2;
                            
                            /**
                            * Draw a white segment where the one that has been clicked on was
                            */
                            context.beginPath();
                                context.fillStyle = 'rgba(255,255,255,0.7)';
                                context.strokeStyle = 'black';
                                context.beginPath();
                                context.moveTo(obj.centerx, obj.centery);
                                context.arc(obj.centerx, obj.centery, obj.angles[i][2], obj.angles[i][0] / 57.3, obj.angles[i][1] / 57.3, 0);
                            context.closePath();

                            context.stroke();
                            context.fill();

                            RGraph.Tooltip(canvas, text, e.pageX, e.pageY);
                            
                            // Now redraw the key and labels
                            obj.DrawLabels();
                        }
                        
                        e.stopPropagation = true;
                        e.cancelBubble    = true;
                        return;
                    }
                }
            }
        
            /**
            * The onmousemove event
            */
            this.canvas.onmousemove = function (e)
            {
                e = RGraph.FixEventObject(e);

                var mouseCoords = RGraph.getMouseXY(e);

                var canvas  = e.target;
                var context = canvas.getContext('2d');
                var obj     = e.target.__object__;
                var r       = e.target.__object__.radius;
                var x       = mouseCoords[0] - obj.centerx;
                var y       = mouseCoords[1] - obj.centery;
                var theta   = Math.atan(y / x); // RADIANS
                var hyp     = theta == 0 ? 0 : (y / Math.sin(theta));

                // Put theta in DEGREES
                 theta *= 57.3

                if (!obj.Get('chart.tooltips')) {
                    return;
                }

                hyp = Math.abs(hyp);

                /**
                * Account for the correct quadrant
                */
                if (x <= 0 && y > 0) {
                    theta += 180;
                } else if (x <= 0 && y <= 0) {
                    theta += 180;
                } else if (x >= 0 && y < 0) {
                    theta += 360;
                }

                theta = parseInt(theta);

                /**
                * The angles for each segment are stored in "angles",
                * so go through that checking if the mouse position corresponds
                */
                for (i=0; i<obj.angles.length; ++i) {
                    if (theta >= parseInt(obj.angles[i][0]) && theta <= parseInt(obj.angles[i][1]) && hyp <= obj.angles[i][2]) {
                    
                        canvas.style.cursor = document.all ? 'hand' : 'pointer';
                        
                        e.stopPropagation = true;
                        e.cancelBubble    = true;
                        return;
                    }
                }

                canvas.style.cursor = 'default';
            }
        
        // This resets the canvas events - getting rid of any installed event handlers
        } else {
            this.canvas.onclick     = null;
            this.canvas.onmousemove = null;
        }
        
        /**
        * If the canvas is annotatable, do install the event handlers
        */
        if (this.Get('chart.annotatable')) {
            RGraph.Annotate(this);
        }
        
        /**
        * This bit shows the mini zoom window if requested
        */
        if (this.Get('chart.zoom.mode') == 'thumbnail' || this.Get('chart.zoom.mode') == 'area') {
            RGraph.ShowZoomWindow(this);
        }

        
        /**
        * This function enables resizing
        */
        if (this.Get('chart.resizable')) {
            RGraph.AllowResizing(this);
        }
    }

    /**
    * This method draws the rose charts background
    */
    RGraph.Rose.prototype.DrawBackground = function ()
    {
        this.context.lineWidth = 1;
    
        // Draw the background grey circles
        this.context.strokeStyle = '#ccc';
        for (var i=15; i<this.radius - this.Get('chart.gutter'); i+=15) {// Radius must be greater than 0 for Opera to work
            this.context.moveTo(this.centerx + i, this.centery);
    
            // Radius must be greater than 0 for Opera to work
            this.context.arc(this.centerx, this.centery, i, 0, 2 * Math.PI, 1);
        }
        this.context.stroke();

        // Draw the background lines that go from the center outwards
        this.context.beginPath();
        for (var i=15; i<360; i+=15) {
        
            // Radius must be greater than 0 for Opera to work
            this.context.arc(this.centerx, this.centery, this.radius - this.Get('chart.gutter'), i / 57.3, i / 57.3, 0);
        
            this.context.lineTo(this.centerx, this.centery);
        }
        this.context.stroke();
        
        this.context.beginPath();
        this.context.strokeStyle = 'black';
    
        // Draw the X axis
        this.context.moveTo(this.centerx - this.radius + this.Get('chart.gutter'), this.centery);
        this.context.lineTo(this.centerx + this.radius - this.Get('chart.gutter'), this.centery);
    
        // Draw the X ends
        this.context.moveTo(this.centerx - this.radius + this.Get('chart.gutter'), this.centery - 5);
        this.context.lineTo(this.centerx - this.radius + this.Get('chart.gutter'), this.centery + 5);
        this.context.moveTo(this.centerx + this.radius - this.Get('chart.gutter'), this.centery - 5);
        this.context.lineTo(this.centerx + this.radius - this.Get('chart.gutter'), this.centery + 5);
        
        // Draw the X check marks
        for (var i=(this.centerx - this.radius + this.Get('chart.gutter')); i<(this.centerx + this.radius - this.Get('chart.gutter')); i+=20) {
            this.context.moveTo(i,  this.centery - 3);
            this.context.lineTo(i,  this.centery + 3);
        }
        
        // Draw the Y check marks
        for (var i=(this.centery - this.radius + this.Get('chart.gutter')); i<(this.centery + this.radius - this.Get('chart.gutter')); i+=20) {
            this.context.moveTo(this.centerx - 3, i);
            this.context.lineTo(this.centerx + 3, i);
        }
    
        // Draw the Y axis
        this.context.moveTo(this.centerx, this.centery - this.radius + this.Get('chart.gutter'));
        this.context.lineTo(this.centerx, this.centery + this.radius - this.Get('chart.gutter'));
    
        // Draw the Y ends
        this.context.moveTo(this.centerx - 5, this.centery - this.radius + this.Get('chart.gutter'));
        this.context.lineTo(this.centerx + 5, this.centery - this.radius + this.Get('chart.gutter'));
    
        this.context.moveTo(this.centerx - 5, this.centery + this.radius - this.Get('chart.gutter'));
        this.context.lineTo(this.centerx + 5, this.centery + this.radius - this.Get('chart.gutter'));
        
        // Stroke it
        this.context.closePath();
        this.context.stroke();
    }


    /**
    * This method draws a set of data on the graph
    */
    RGraph.Rose.prototype.DrawRose = function ()
    {
        var data = this.data;

        // Must be at least two data points
        if (data.length < 2) {
            alert('[ROSE] Must be at least two data points! [' + data + ']');
            return;
        }
    
        // Work out the maximum value and the sum
        this.scale = RGraph.getScale(RGraph.array_max(data));
        this.max = this.scale[4];
        this.sum = RGraph.array_sum(data);
        
        // Move to the centre
        this.context.moveTo(this.centerx, this.centery);
    
        this.context.stroke(); // Stroke the background so it stays grey
    
        // Transparency
        if (this.Get('chart.colors.alpha')) {
            this.context.globalAlpha = this.Get('chart.colors.alpha');
        }

        for (var i=0; i<this.data.length; ++i) {
            // Set the stroke colour to the colour - currently hard coded to black
            this.context.strokeStyle = 'black';
            
            if (this.Get('chart.colors')[i]) {
                this.context.fillStyle = this.Get('chart.colors')[i];
            }
    
            var segmentRadians = (1 / this.data.length) * (2 * Math.PI)
    
            this.context.beginPath(); // Begin the segment   
                var radius = (this.data[i] / this.max) * (this.radius - this.Get('chart.gutter') - 10);
                this.context.arc(this.centerx, this.centery, radius, this.startRadians, (this.startRadians + segmentRadians), 0);
                this.context.lineTo(this.centerx, this.centery);
                this.context.fill();
            this.context.closePath(); // End the segment
            
            // Store the start and end angles
            this.angles.push([this.startRadians * 57.3, (this.startRadians + segmentRadians) * 57.3, radius]);

            this.startRadians += segmentRadians;
            this.context.stroke();
        }
        // Turn off the transparency
        if (this.Get('chart.colors.alpha')) {
            this.context.globalAlpha = 1;
        }

        // Draw the title if any has been set
        if (this.Get('chart.title')) {
            RGraph.DrawTitle(this.canvas, this.Get('chart.title'), this.Get('chart.gutter'), this.centerx, this.Get('chart.text.size') + 2);
        }
    }


    /**
    * Unsuprisingly, draws the labels
    */
    RGraph.Rose.prototype.DrawLabels = function ()
    {
        this.context.lineWidth = 1;
        var key = this.Get('chart.labels') ? this.Get('chart.labels') : this.Get('chart.key');

        if (key && key.length) {
            RGraph.DrawKey(this, key, this.Get('chart.colors'));
        }
        
        // Set the color to black
        this.context.fillStyle = 'black';
        
        var r         = this.radius - 10;
        var font_face = this.Get('chart.text.font');
        var font_size = this.Get('chart.text.size') - 2;
        var context   = this.context;
        var axes      = this.Get('chart.labels.axes').toLowerCase();

        // The "North" axis labels
        if (axes.indexOf('n') > -1) {
            RGraph.Text(context, font_face, font_size, this.centerx, this.centery - ((r - this.Get('chart.gutter')) * 0.2), String(this.scale[0]), 'center', 'center', false, false, 'white');
            RGraph.Text(context, font_face, font_size, this.centerx, this.centery - ((r - this.Get('chart.gutter')) * 0.4), String(this.scale[1]), 'center', 'center', false, false, 'white');
            RGraph.Text(context, font_face, font_size, this.centerx, this.centery - ((r - this.Get('chart.gutter')) * 0.6), String(this.scale[2]), 'center', 'center', false, false, 'white');
            RGraph.Text(context, font_face, font_size, this.centerx, this.centery - ((r - this.Get('chart.gutter')) * 0.8), String(this.scale[3]), 'center', 'center', false, false, 'white');
            RGraph.Text(context, font_face, font_size, this.centerx, this.centery - r + this.Get('chart.gutter'), String(this.scale[4]), 'center', 'center', false, false, 'white');
        }

        // The "South" axis labels
        if (axes.indexOf('s') > -1) {
            RGraph.Text(context, font_face, font_size, this.centerx, this.centery + ((r - this.Get('chart.gutter')) * 0.2), String(this.scale[0]), 'center', 'center', false, false, 'white');
            RGraph.Text(context, font_face, font_size, this.centerx, this.centery + ((r - this.Get('chart.gutter')) * 0.4), String(this.scale[1]), 'center', 'center', false, false, 'white');
            RGraph.Text(context, font_face, font_size, this.centerx, this.centery + ((r - this.Get('chart.gutter')) * 0.6), String(this.scale[2]), 'center', 'center', false, false, 'white');
            RGraph.Text(context, font_face, font_size, this.centerx, this.centery + ((r - this.Get('chart.gutter')) * 0.8), String(this.scale[3]), 'center', 'center', false, false, 'white');
            RGraph.Text(context, font_face, font_size, this.centerx, this.centery + r - this.Get('chart.gutter'), String(this.scale[4]), 'center', 'center', false, false, 'white');
        }
        
        // The "East" axis labels
        if (axes.indexOf('e') > -1) {
            RGraph.Text(context, font_face, font_size, this.centerx + ((r - this.Get('chart.gutter')) * 0.2), this.centery, String(this.scale[0]), 'center', 'center', false, false, 'white');
            RGraph.Text(context, font_face, font_size, this.centerx + ((r - this.Get('chart.gutter')) * 0.4), this.centery, String(this.scale[1]), 'center', 'center', false, false, 'white');
            RGraph.Text(context, font_face, font_size, this.centerx + ((r - this.Get('chart.gutter')) * 0.6), this.centery, String(this.scale[2]), 'center', 'center', false, false, 'white');
            RGraph.Text(context, font_face, font_size, this.centerx + ((r - this.Get('chart.gutter')) * 0.8), this.centery, String(this.scale[3]), 'center', 'center', false, false, 'white');
            RGraph.Text(context, font_face, font_size, this.centerx + r - this.Get('chart.gutter'), this.centery, String(this.scale[4]), 'center', 'center', false, false, 'white');
        }

        // The "West" axis labels
        if (axes.indexOf('w') > -1) {
            RGraph.Text(context, font_face, font_size, this.centerx - ((r - this.Get('chart.gutter')) * 0.2), this.centery, String(this.scale[0]), 'center', 'center', false, false, 'white');
            RGraph.Text(context, font_face, font_size, this.centerx - ((r - this.Get('chart.gutter')) * 0.4), this.centery, String(this.scale[1]), 'center', 'center', false, false, 'white');
            RGraph.Text(context, font_face, font_size, this.centerx - ((r - this.Get('chart.gutter')) * 0.6), this.centery, String(this.scale[2]), 'center', 'center', false, false, 'white');
            RGraph.Text(context, font_face, font_size, this.centerx - ((r - this.Get('chart.gutter')) * 0.8), this.centery, String(this.scale[3]), 'center', 'center', false, false, 'white');
            RGraph.Text(context, font_face, font_size, this.centerx - r + this.Get('chart.gutter'), this.centery, String(this.scale[4]), 'center', 'center', false, false, 'white');
        }

        RGraph.Text(context, font_face, font_size, this.centerx,  this.centery, '0', 'center', 'center', false, false, 'white');
    }