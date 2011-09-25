/*
 * Copyright (C) 2006, José Coelho (jose.alberto.coelho@gmail.com)
 * This program is free software; you can redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software Foundation; either version 2 of the License,
 * or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even
 * the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General
 * Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program; if not,
 * write to the Free Software Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
 *
 */

/*
 *
 * this class isnt ready to consume
 *
 */

function ParseHtml(string) 
{
	this.contents = null;
	
	if (string)
		this.contents = string;
}

ParseHtml.prototype.searchString = function(string) {
	var regex = RegExp(string, "img");
	var aux = this.contents.match(regex);
	
	return (aux ? true : false);
}

ParseHtml.prototype.getFormAttributesByName = function(name) {
	var regex = RegExp("<form.*name[^=]*=[^(\'|\")]*(\"|\')"+name+"(\"|\')[^>]*>", "img");
	var aux = this.contents.match(regex);
	var events = new Array("action", "method", "id");
	
	if (aux) {
		aux = aux[0];
		var result = new Object();
			
		for(var i=0; i < events.length; i++)
		{
			var tmp = aux.match(new RegExp(events[i]+"[\ \t]*=\"[^\"]*\"", "i"));
			if(tmp)
			{
				tmp = tmp[ 0].replace(new RegExp(events[i]+"[\t\ ]*=(\"|\')","i"), "");
				tmp = tmp.substr(0, tmp.length - 1);
			}
			result[ events[i] ] = tmp;
		}
		return result;
	}
}

ParseHtml.prototype.getAllInputs = function() {
	var regex = RegExp("<input[^>]*>", "img");
	var aux = this.contents.match(regex);

	var events = new Array('name', 'id', 'value', 'class', 'length', 'style');
	
	if (aux) {
		var result = new Array();
		
		for (var i=0; i < aux.length; i++) {
			var tmp = aux[i];
			var attributes = new Object();
			
			for(var j=0; j < events.length; j++)
			{
				var match = tmp.match(new RegExp(events[j]+"[\ \t]*=\"[^\"]*\"", "i"));
				if(match)
				{
					match = match[ 0].replace(new RegExp(events[j]+"[\t\ ]*=(\"|\')","i"), "");
					match = match.substr(0, match.length - 1);
				}
				attributes[ events[j] ] = match;
			}
			
			result.push( attributes );
		}
		return result;
	}
}

ParseHtml.prototype.getInputByName = function(name) {
	var regex = RegExp("<input.*name[^=]*=[^(\'|\")]*(\"|\')"+name+"(\"|\')[^>]*>", "img");
	var aux = this.contents.match(regex);
	var events = new Array("value", "class","id");
	
	if (aux) {
		aux = aux[0];
		var result = new Object();
			
		for(var i=0; i < events.length; i++)
		{
			var tmp = aux.match(new RegExp(events[i]+"[\ \t]*=\"[^\"]*\"", "i"));
			if(tmp)
			{
				tmp = tmp[ 0].replace(new RegExp(events[i]+"[\t\ ]*=(\"|\')","i"), "");
				tmp = tmp.substr(0, tmp.length - 1);
			}
			result[ events[i] ] = tmp;
		}
		return result;
	}
}	

/**
 * Method specialized on selects
 * @return null if select not found, else return an object with slots for each event and an options array
 */
ParseHtml.prototype.getSelect = function(name)
{
	var regex = RegExp("<select.*name[^=]*=[^(\'|\")]*(\"|\')"+name+"(\"|\')[^>]*>", "img");
	var aux = this.contents.match( regex );
	var events = new Array( "onchange", "onclick");
	var search = null;
	
	if(aux)
	{
		aux = aux[ 0];
		var result = new Object();
		
		for(var i=0; i < events.length; i++)
		{
			var tmp = aux.match(new RegExp(events[i]+"[\ \t]*=\"[^\"]*\"", "i"));
			if(tmp)
			{
				tmp = tmp[ 0].replace(new RegExp(events[i]+"[\t\ ]*=(\"|\')","i"), "");
				tmp = tmp.substr(0, tmp.length - 1);
			}
			result[ events[i] ] = tmp;
		}
		
		search = this.contents.substr( this.contents.indexOf(aux), this.contents.length );
		search = search.substr(0, search.indexOf("</select>")+10);
		
		result[ "options" ] = search.match(/<option[^>]*>[^<]*<[^>]*>/img);
		
		return result;
	}
	return null;
}

/**
 * Searchs by tag name 
 * @return null if not found, else an array with all matches
 */
ParseHtml.prototype.getElementsByTagName = function(name)
{
	var regex = new RegExp("<"+name+"[^>]*>", "mg");
	var aux = this.contents.match( regex );	
	if( aux )
	{
		var result = new Array(aux.length - 1);
		var search = null;
		var text = this.contents;
		
		for(var i = 0; i < aux.length; i++)
		{
			var search = null;
			var lvl = 0; //this variable will work as a stack
	
			search = text.substr( text.indexOf(aux[ i])+2, text.length )

			while(1) 
			{
				var indexTable = search.indexOf("<"+name);
				var indexEndTable = search.indexOf("<\/"+name);
		
				if( indexTable < indexEndTable && indexTable > -1 )
				{
					/* tags inside tags, lets increase the lvl */
					lvl++;
					search = search.replace( "<"+name, "-"+name );
				}
				else if( lvl > 0 && indexEndTable > -1 )
				{
					/* close a tag, decrease lvl */
					lvl--;
					search = search.replace( "<\/"+name, "--"+name );
				}
				else if( lvl == 0 && indexEndTable > -1  )
				{
					/* closing tag that matches the search tag */
					search = text.substr( text.indexOf(aux[ i]),
							search.indexOf("<\/"+name)+(5+name.length) );
					break;
				}
				else
				{
					/* this shouldnt happen */
					search = "error during parse";
					break
				}	
			}
			result[i] = search;
			text = text.substr( text.indexOf(aux[ i])+2, text.length );
		}
		return result;
	}
	//nothing found, return null
	return null;
}

ParseHtml.prototype.getElementsByClassName = function(name)
{
	var regex = new RegExp("<.*class[^=]*=[^(\'|\")]*(\"|\')"+name+"(\"|\')[^>]*>", "img");
	var aux = this.contents.match( regex );	
	if( aux )
	{
		var result = new Array(aux.length - 1);
		var search = null;
		var text = this.contents;
		
		for(var i = 0; i < aux.length; i++)
		{
			var search = null;
			var lvl = 0; //this variable will work as a stack
			var type = aux[ i].match( /<\w+/ );
			type = type[ 0].replace("<","");
	
			search = text.substr( text.indexOf(aux[ i])+2, text.length )

			while(1) 
			{
				var indexTable = search.indexOf("<"+type);
				var indexEndTable = search.indexOf("<\/"+type);
		
				if( indexTable < indexEndTable && indexTable > -1 )
				{
					/* tags inside tags, lets increase the lvl */
					lvl++;
					search = search.replace( "<"+type, "-"+type );
				}
				else if( lvl > 0 && indexEndTable > -1 )
				{
					/* close a tag, decrease lvl */
					lvl--;
					search = search.replace( "<\/"+type, "--"+type );
				}
				else if( lvl == 0 && indexEndTable > -1  )
				{
					/* closing tag that matches the search tag */
					search = text.substr( text.indexOf(aux[ i]),
							search.indexOf("<\/"+type)+(5+type.length) );
					break;
				}
				else
				{
					/* this shouldnt happen */
					search = "error during parse";
					break
				}	
			}
			result[i] = search;
			text = text.substr( text.indexOf(aux[ i])+2, text.length );
		}
		return result;
	}
	//nothing found, return null
	return null;
}

ParseHtml.prototype.getElementById = function(name)
{
	var lvl = 0; //this variable will work as a stack
	var regex = new RegExp("<.*id[^=]*=[^(\'|\")]*(\"|\')"+name+"(\"|\')[^>]*>", "mg");
	var aux = this.contents.match( regex );
	var search = null;

	if( aux )
	{
		var type = aux[ 0].match( /<\w+/ );
		type = type[ 0].replace("<","");
		
		search = this.contents.substr( this.contents.indexOf(aux[ 0])+2, this.contents.length )
	
		while(1) 
		{
			var indexTable = search.indexOf("<"+type);
			var indexEndTable = search.indexOf("<\/"+type);
			
			if( indexTable < indexEndTable && indexTable > -1 )
			{
				/* tags inside tags, lets increase the lvl */
				lvl++;
				search = search.replace( "<"+type, "-"+type );
			}
			else if( lvl > 0 && indexEndTable > -1 )
			{
				/* close a tag, decrease lvl */
				lvl--;
				search = search.replace( "<\/"+type, "--"+type );
			}
			else if( lvl == 0 && indexEndTable > -1  )
			{
				/* closing tag that matches the search tag */
				search = this.contents.substr( this.contents.indexOf(aux[ 0]),
						search.indexOf("<\/"+type)+(5+type.length) );
				break;
			}
			else
			{
				/* this shouldnt happen */
				search = "error during parse";
				break
			}	
		}
		return search;
	}
	//nothing found, return null
	return null;
}

