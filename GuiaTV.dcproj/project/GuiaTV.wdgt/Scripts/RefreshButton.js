function RefreshButton(flipper, front, imageURL, onclick)
{
	/* Read-write properties */
    this.onclick = onclick;
    
    /* Internal */
	this._front = front;
	this._flipper = flipper;
	this._flipLabel = document.createElement("img");
	this._flipLabel.width = 16;
	this._flipLabel.height = 16;
	this._flipLabel.setAttribute("alt", "Refresh");
	this._flipCircle = document.createElement("div");
	flipper.appendChild(this._flipCircle);
	flipper.appendChild(this._flipLabel);
    this._labelshown = false;
		
	// For JavaScript event handlers
	var _self = this;
	
	this._updateOpacity = function(animation, now, first, done)
	{
		_self._flipLabel.style.opacity = now;
	}
	
	this._animationComplete = function()
	{
		delete _self._animation;
		delete _self._animator;
	}
	
	this._frontMove = function(event)
	{
		if (_self._outdelay !== undefined)
		{
			clearTimeout(_self._outdelay);
			delete _self._outdelay;
		}
		if (_self._labelshown)
			return;
		
		var from = 0.0;
		var duration = 500;
		if (_self._animation !== undefined)
		{
			from = _self._animation.now;
			duration = (new Date).getTime() - _self._animator.startTime;
			_self._animator.stop();
		}
		
		_self._labelshown = true;
		
		var animator = new AppleAnimator(duration, 13);
		animator.oncomplete = _self._animationComplete;
		_self._animator = animator;
		
		_self._animation = new AppleAnimation(from, 1.0, _self._updateOpacity);
		animator.addAnimation(_self._animation);
		animator.start();
	}
	
	this._frontOutDelay = function(event)
	{
		if (_self._outdelay === undefined)
		{
			_self._outdelay = setTimeout(_self._frontOut, 0, _self);
		}
	}
	
	this._frontOut = function(_self)
	{
		if (_self._outdelay !== undefined)
		{
			clearTimeout(_self._outdelay);
			delete _self._outdelay;
		}
		if (!_self._labelshown)
			return;
		
		var from = 1.0;
		var duration = 500;
		if (_self._animation !== undefined)
		{
			from = _self._animation.now;
			duration = (new Date).getTime() - _self._animator.startTime;
			_self._animator.stop();
		}
		
		var animator = new AppleAnimator(duration, 13);
		animator.oncomplete = _self._animationComplete;
		_self._animator = animator;
		
		_self._animation = new AppleAnimation(from, 0.0, _self._updateOpacity);
		animator.addAnimation(_self._animation);
		animator.start();
	
		_self._labelshown = false;
	}
	
	this._labelOver = function(event)
	{
		_self._tempMouseOver = true; // remove later
		_self._flipCircle.style.visibility = "visible";
	}
	
	this._labelOut = function(event)
	{
		delete _self._tempMouseOver; // remove later
		_self._flipCircle.style.visibility = "hidden";
	}
	
	this._labelClicked = function(event)
	{		
		_self._flipCircle.style.visibility = "hidden";
		
		try {
			if (_self.onclick != null)
				_self.onclick(event);
		} catch(ex) {
			throw ex;
		} finally {
			event.stopPropagation();
    	    event.preventDefault();
    	}
	}
	
	this._tempLabelDown = function(event)
	{
		document.addEventListener("mouseup", _self._tempDocUp, true);
		event.stopPropagation();
		event.preventDefault();
	}
	
	this._tempDocUp = function(event)
	{
		document.removeEventListener("mouseup", _self._tempDocUp, true);
		
		// if we're over the label
		if (_self._tempMouseOver !== undefined)
		{
			delete _self._tempMouseOver;
			_self._labelClicked(event);
		}
	}

	// Set up style
	var style = this._flipLabel.style;
	style.position = "absolute";
	style.top = 0;
	style.left = 0;
	style.opacity = 0;
	
	style = this._flipCircle.style;
	style.position = "absolute";
	style.top = 0;
	style.left = 0;
	style.width = "16px";
	style.height = "16px";
	this.setCircleOpacity(0.25);
	style.visibility = "hidden";

	this.setImageURL(imageURL);
	
	this._front.addEventListener("mousemove", this._frontMove, true);
	this._front.addEventListener("mouseout", this._frontOutDelay, true);

// temp stuff
	this._flipper.addEventListener("mousedown", this._tempLabelDown, true);
	this._flipper.setAttribute("onclick", "event.stopPropagation(); event.preventDefault();");
// switch to this later
//	this._flipper.addEventListener("click", this._labelClicked, true);
	this._flipper.addEventListener("mouseover", this._labelOver, true);
	this._flipper.addEventListener("mouseout", this._labelOut, true);
}

RefreshButton.prototype.remove = function()
{
	this._front.removeEventListener("mousemove", this._frontMove, true);
	this._front.removeEventListener("mouseout", this._frontOutDelay, true);

	this._flipper.removeEventListener("mousedown", this._tempLabelDown, true);
//	this._flipper.removeEventListener("click", this._labelClicked, true);
	this._flipper.removeEventListener("mouseover", this._labelOver, true);
	this._flipper.removeEventListener("mouseout", this._labelOut, true);
	
	var parent = this._flipLabel.parentNode;
	parent.removeChild(this._flipCircle);
	parent.removeChild(this._flipLabel);
}

RefreshButton.prototype.setImageURL = function(img)
{
	this._flipLabel.src = img + "refresh.png";
	this._flipCircle.style.background = "url(" + img + "refresh_rollie.png) no-repeat top left";
}

RefreshButton.prototype.setCircleOpacity = function(opacity)
{
	this._flipCircle.style.opacity = opacity;
}
