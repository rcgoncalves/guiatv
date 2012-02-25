/**
 * Original author: José Coelho
 * Revised by: Rui Carlos Gonçalves <rcgoncalves.pt@gmail.com>
 */
/* a lot diferent from prototype */
function $(element) { return document.getElementById(element); }

if (!Guia) { var Guia = new Object(); }

if (window.widget) {
	widget.onshow = function() {
		var tmp = new Date().getDay();
		
		if (Guia.lastUpdate != tmp) {
			/* save new day */
			widget.setPreferenceForKey(new Date().getDay(), Guia.widgetKey("update"));
			Guia.lastUpdate = widget.preferenceForKey(Guia.widgetKey("update"));
			
			/* update contents */
			Guia.weekDays();
			Guia.getContents(0);
			return 0;
		}

		// if nothing selected -> small version
		if (!$('contents').innerHTML.length) {
			Guia.size.small();
		}
			
	}
	
	widget.onhide = function() { }
	
	widget.onremove = function() {
		// remove user preferences on widget remove
		widget.setPreferenceForKey(null, Guia.widgetKey("selection"));
		widget.setPreferenceForKey(null, Guia.widgetKey("update"));
		widget.setPreferenceForKey(null, Guia.widgetKey("package"));
	}
}

Guia.setupWidget = function() {
	Guia.doneButton = new AppleGlassButton($('doneButton'), 'Done', Guia.prefs.store);
	Guia.infoButton = new AppleInfoButton($('infoButton'), $('front'), 'black', 'black', Guia.prefs.set);
	Guia.progress = new Guia.progressIndicator('progressGraphic');
	
	// Set up scrollbar
	Guia.scrollbar = new AppleVerticalScrollbar($('scrollbar'));
	Guia.scrollArea = new AppleScrollArea($('contents'));
	
	Guia.scrollArea.addScrollbar(Guia.scrollbar);
	
	// scrollBar settings
	Guia.scrollArea.focus();
	Guia.scrollsHorizontally = false;
	Guia.singlepressScrollPixels = 25;
	Guia.scrollbar.autohide = true;

	// print week bar
	Guia.weekDays();
	
	// small vs big version
	Guia.size = new Guia.collapse();
	
	/* Load Preferences */
	Guia.userSelection = widget.preferenceForKey(Guia.widgetKey("selection"));
	if (Guia.userSelection)
		Guia.userSelection = Guia.userSelection.split(',');
	
	Guia.lastUpdate = widget.preferenceForKey(Guia.widgetKey("update"));
	
	Guia.prefs.openPackage(widget.preferenceForKey(Guia.widgetKey("package")));
	Guia.prefs.setSelectedPackage(widget.preferenceForKey(Guia.widgetKey("package")));
	
	/* safe preferences if null */
	if (Guia.lastUpdate == null) {
		widget.setPreferenceForKey(new Date().getDay(), Guia.widgetKey("update"));
		Guia.lastUpdate = widget.preferenceForKey(Guia.widgetKey("update"));
	}
	
	if(Guia.userSelection) {
		/* draw drop down */
		Guia.prefs.createMenu();
	}

	// download the contents
	Guia.getContents();
}

Guia.getContents = function(dia) {
	var select = $('dropdown');
	
	if (select.length == 0) { /* it needs at least one channel selected */
		Guia.prefs.set();
	}
	else {
		id = select.selectedIndex;

		if (id == 0) {
			$('selected').innerHTML = "Seleccione >>";
		}
		else {
			
			id = select.options[select.selectedIndex].value;
			
			// expand if needed
			if (!Guia.size.status) Guia.size.alter();
			
			$('weekHolder').style.background = "url('Images/Weekdays/week"+(dia ? dia : 0)+".png')"
			
			var tmp =  Channels[id].name;
			$('selected').innerHTML = tmp.substring(0,8);
			Guia.getDataForChannel(Channels[id].id,(dia ? dia : 0));		
		}
	}
}

Guia.getDataForChannel = function(channelId, weekDay) {
	//clear previous information
	$("contents").innerHTML = "";
	Guia.scrollbar.refresh();
	Guia.scrollArea.refresh();
	
	// start feedback
	Guia.progress.start();

	var web = new URL();
	var parse = new ParseHtml();
	
	/* the inside number for channel */
	channelNumber = 0;
	for (var i=0; i < Channels.length; i++) {
		if ( Channels[i].id == channelId )
		{
			channelNumber = (i + 1);
			break;
		}
	};
	
	/* for some reason compression dont work */
	web.noCompression();

	web.location = 'http://www.zon.pt/tv/guiaTV/Pages/Guia-TV-programacao.aspx?channelSigla='+ channelId;

	web.fetchAsync(parseContents);
	
	function parseContents(web) {
		parse.contents =  web.result;
		
		if (parse.contents == null) {
			alert("Need repair")
			return;
		}
		
        // obtain div id based on current day
        var date = new Date();
        date.setDate(date.getDate() + weekDay);
        var day = "day" + date.getDate();
        // get ul element with desired info
        information = parse.getElementById(day);
        information.replace(/\r/g, '');
        var div = document.createElement( 'div' );
        div.innerHTML = information;
        var list = div.children[0].children[0];
        
		listening = new String();
		var now = [date.getHours(), date.getMinutes()];
        var current = -1;
		
        if(information == null) {
            listening = "<b>Não existe informação disponível sobre este canal.</b>";
        }
        else {
            for(var i=0; i < list.children.length; i++) {
                hour = list.children[i].children[0].children[0].children[2].innerHTML.substring(0,5);
                program = list.children[i].children[0].children[0].children[0].innerHTML;
                listening += '<div id="prog' + i + '" class="' + (i%2 ? 'even' : 'odd' )  + '">';
                listening += hour + ' ' + program;
                listening += '</div>';
			
                // find out the current show
                // check to see if the show time is after the current time and then selects the previous show
                var hm = hour.split(':');
                if ( current == -1 && hm[0] > now[0] || (hm[0] == now[0] && hm[1] > now[1]) ) {
                    current = i - 1;
                }
            }
        }
		
		Guia.progress.stop();
		$('contents').innerHTML = listening;
		
        if(information != null) {
            $('prog' + current).innerHTML = '<b><i>' + $('prog' + current).innerHTML + '</i></b>';
            Guia.scrollArea.reveal($('prog' + current));
        }

		Guia.scrollbar.refresh();
		Guia.scrollArea.refresh();
	}
}

Guia.prefs = {
	setPackage: function() {
		select = $('package').elements[0];
		pacote = select.options[select.selectedIndex].value;
		Guia.prefs.openPackage(pacote);
		widget.setPreferenceForKey(pacote, Guia.widgetKey( "package" ));
		
		
		/* clean previous channels */
		Guia.userSelection = null;
		
		form = $('userSelection');
		
		/* ugly but fast */
		form.innerHTML = null;
		
		Guia.prefs.drawCheckBoxes();
	},
	
	openPackage: function(pack) {
		switch(pack) {
			case 'FantasticHD':
				Channels = FantasticHD;
				Guia.selectedPackage = 0;
			break;
			case 'DigitalHD':
				Channels = DigitalHD;
				Guia.selectedPackage = 1;
			break;
			break;
			case 'SeleccaoDigital':
				Channels = SeleccaoDigital;
				Guia.selectedPackage = 2;
			break;
			case 'BaseSportTV':
				Channels = BaseSportTV;
				Guia.selectedPackage = 3;
			break;
			case 'SegundaHabitacao':
				Channels = SegundaHabitacao;
				Guia.selectedPackage = 4;
			break;
      case 'Base':
        Channels = Base;
        Guia.selectedPackage = 5;
      break;
			default:
				Channels = null;
				Guia.selectedPackage = -1;
		}
	},
	
	setSelectedPackage: function(pack) {
		select = $('package').elements[0];
		
		for(var i=0; i < select.options.length; i++) {
			if(select.options[i].value == pack) {
				select.selectedIndex = i;
				return;
			}
		}
	},
	
	drawCheckBoxes: function() {
		form = $('userSelection');

    while(form.firstChild) form.removeChild(form.firstChild);


		if(Channels == null) return;
		
		for (var i=0; i < Channels.length; i++) {
			/* create a checkbox item */
			var box = document.createElement("input");
			box.type = "checkbox";
			box.id = "c"+Channels[i].id;

			/* if user selected a channel previous */
			if (Guia.userSelection) {
				for( var j = 0; j < Guia.userSelection.length; j++) {
					if(Guia.userSelection[j] == i) {
						box.checked = true;
					}
				}
			}

			var p = document.createElement("p");
			var txt = document.createTextNode(Channels[i].name);

			p.appendChild(box);
			p.appendChild(txt);

			form.appendChild(p);
		};
	},
	
	set: function() {
		Guia.prefs.drawCheckBoxes();
		
		/* call draw method */
		Guia.show.back();
	},
	
	store: function() {
		var form = $('userSelection');
		var userSelection = new Array();
		
		/* get user selection */
		for (var i=0; i < form.length; i++) {
			if (form[i].type == "checkbox" && form[i].checked == true) {
				userSelection.push(i);
			};
		};
		
		/* store user prefs */
		Guia.userSelection = userSelection;
		
		/* draw drop down */
		Guia.prefs.createMenu();
		
		/* Save Preferences */
		widget.setPreferenceForKey(Guia.userSelection.join(), Guia.widgetKey( "selection" ));
		
		/* call draw method */
		Guia.show.front();
		
		/* small version */
		Guia.size.small();
	},
	
	createMenu: function() {
		
		var dropdown = $('dropdown');
		dropdown.options.length = 0; /* clean old options */

		/* first option */
		$('selected').innerHTML = "Seleccione >>";
		dropdown.options[0] = new Option("Seleccione >>", "none");
		
		/* may not be defined */
		if(Channels == null) return;
		
		for (var i=0; i < Guia.userSelection.length; i++) {
			ch = Guia.userSelection[i];
			dropdown.options[i+1] =  new Option(Channels[ch].name, ch);
		};
	}
}

Guia.show = {
	front: function() {
		if (window.widget) widget.prepareForTransition("ToFront");

	    $('front').style.display = "block";
	    $('back').style.display = "none";
	
		if (window.widget) setTimeout ('widget.performTransition();', 0);
	},
	
	back: function() {
		if (window.widget) widget.prepareForTransition("ToBack");

	    $('front').style.display= "none";
	    $('back').style.display= "block";
	
		if (window.widget) setTimeout ('widget.performTransition();', 0);
	}
}

Guia.openWebsite = function() {
    widget.openURL('http://rcgoncalves.net/project/guiatv/');
}

Guia.collapse = function() {
	// small version status is false
	this.status = true;
}

Guia.collapse.prototype = {
	alter: function() {
		
		if (this.status == true) {
			$('expanded').style.visibility = 'hidden';
			$('front').style.background = 'url("Images/small.png") no-repeat';
			this.status = false;
		}
		else {
			$('expanded').style.visibility = 'visible';
			$('front').style.background = 'url("Default.png")';
			this.status = true;
		}
	},
	
	small: function() {
		$('expanded').style.visibility = 'hidden';
		$('front').style.background = 'url("Images/small.png") no-repeat';
		this.status = false;
	}
}

Guia.utils = {
	stripTags: function() {
		var string = arguments[ 0];
		var strip = arguments[ 1];
		for(var i = 2; i < arguments.length; i++)
		{
			var regex = new RegExp("<"+arguments[i]+"[^>]*>","img");
			string = string.replace(regex, strip ? "" : "<"+arguments[i]+">");
		}
		return string;
	}
	,
	removeWholeTag: function() {
		var div = document.createElement( 'div' );
		div.innerHTML = arguments[0];
		for ( var i = 0; i < div.childNodes.length; i++ )
		{
			for ( var j = 1; j < arguments.length; j++ )
			{
				if ( div.childNodes[i].nodeName.toLowerCase() == arguments[j].toLowerCase() ) {
					div.removeChild(div.childNodes[i]);
				}
			}
		}
		
		return div.innerHTML;
	}
}

Guia.weekDays = function() {
	var days = new Array('D', '2ª', '3ª', '4ª', '5ª', '6ª', 'S');
	var tmp = new Date().getDay();
	
	for (var i=1; i <= 6; i++) {
		$('p'+i).innerHTML = days[(tmp+i)%7];
	};
}

Guia.progressIndicator = function(element) {
	this.count = 0;
    this.timer = null;
    this.element = $(element);
    this.element.style.display = "none";
    this.imageBaseURL = "Images/Progress/prog";
}

Guia.progressIndicator.prototype = {
    start : function () {
        this.element.style.display = "block";
        if (this.timer) clearInterval(this.timer);
        this.tick();
        var localThis = this;
        this.timer = setInterval (function() { localThis.tick() }, 60);
    },

    stop : function () {
        clearInterval(this.timer);
        this.element.style.display = "none";
    },

    tick : function () {
        var imageURL = this.imageBaseURL + (this.count + 1) + ".png";
        this.element.src = imageURL;
        this.count = (this.count + 1) % 12;
    }
}

Guia.widgetKey = function(name) { return widget.identifier + '-' + name; }