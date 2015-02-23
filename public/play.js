var playState = {
	create : function(){
		
		this.setIconSize(game.global);

		var iconScale = (game.global.iconSize / game.global.imageSize).toFixed(3),
			rows = game.global.rows, 
			cols = game.global.cols;

		this.board = new this.Board(game);

		for(var i = 0, q = rows * cols; i < q; i++){
			var rnd = Math.floor(Math.random() * game.global.iconNames.length),
				x = Math.floor(game.global.offsetX + game.global.iconSize * (i % cols)),
				y = Math.floor(game.global.offsetY + game.global.iconSize * Math.floor(i / cols)),
				col = i % cols,
				row = Math.floor(i / cols);

			if(i > cols - 1){
				if(this.board.icons[i - cols].key === game.global.iconNames[rnd]) rnd = this.getRandomName(rnd);
			}
			if(i % cols > 0){
				if(this.board.icons[i - 1].key === game.global.iconNames[rnd]) rnd = this.getRandomName(rnd);
			}

			var icon = game.add.sprite(x, y, game.global.iconNames[rnd]);
			icon.scale.x = icon.scale.y = iconScale;
			game.physics.arcade.enable(icon);

			icon.inH = false;
			icon.inV = false;
			icon.processed = false;

			this.board.icons[i] = icon;
		}

		this.board.createMap();

		this.sequence = new this.Sequence(game);

		this.board.makeTurn();

		this.tapped = false;
	},

	update : function () {
		if(game.input.activePointer.isDown){
			if(game.time.now - this.tapped < game.global.tapDelay) return;
			this.board.makeTurn();

			var relX = game.input.activePointer.x - game.global.offsetX,
				relY = game.input.activePointer.y - game.global.offsetY,
				index = Math.floor(relY / game.global.iconSize) * game.global.cols + Math.floor(relX / game.global.iconSize);

			this.insertIcon(index);
			this.tapped = game.time.now;
		}
	},

	insertIcon : function(index){
		var txt = this.sequence.elements[0].key;
		this.board.icons[index].loadTexture(txt);
		this.sequence.shift();

		this.board.makeTurn();
	},

	setIconSize : function(global){
		var size = Math.floor((global.height - global.offsetY * 2) / global.rows); 
		while(size * global.cols > global.width - global.offsetX * 2){
			size--;
		}
		global.offsetX = (global.width - size * global.cols) / 2;
		global.offsetY = (global.height - size * global.rows) / 2;
		global.iconSize = size;
	},

	getRandomName : function(prev){
		var rnd = Math.floor(Math.random() * game.global.iconNames.length);
		if(rnd === prev) return this.getRandomName(rnd);
		return rnd;
	}
}

playState.Board = function(game){
	this.icons = [];
	this.cols = game.global.cols;
	this.rows = game.global.rows;

	this._combs = [];
	this._toMove = {};
	this.game = game;

	this.map = {};
}

playState.Board.prototype = {
	makeTurn : function () {
		var self = this;

		this.findThreesomes();

		if(this._combs.length == 0) return;

		this.computeMovements();

		this.moveIcons(function () {
			self.changeIndexes();
			self.addIcons();
			self.defaultValues();
			self.makeTurn();
		});
	},

	findThreesomes : function(){
		for(var i = 0, l = this.icons.length; i < l; i++){
			if (l - i > this.cols * 2){
				this._checkComb(i, 'inV', 'down');
			}
			if (i % this.cols < this.cols - 2){
				this._checkComb(i, 'inH', 'right');
			}
		}

		if(this._combs.length < 1) return;

		for(var i = 0; i < this._combs.length; i++){
			for(var k = 0; k < this._combs[i].length; k++){
				var index = this._combs[i][k];
				this.icons[index].visible = false;
			}
		}
	},

	_checkComb :  function(i, prop, dir){
		if (this.icons[i][prop]) return false;
		var current = [],
			hasComb = true;

		current.push(i);

		while(hasComb){
			var prev = this.icons[i],
				index = this.map[i][dir],
				icon = this.icons[index];

			if (icon.key == prev.key){
				current.push(index);
				if(!this.map[index][dir]) hasComb = false;
			}
			else {
				hasComb = false;
			}
			i = index;
		}

		if(current.length > 2){
			for(var i = 0, l = current.length; i < l; i++){
				var index = current[i];
				this.icons[index][prop] = true;
			}
			this._combs.push(current);
		}
	},

	computeMovements : function(){
		for(var i = 0, l = this._combs.length; i < l; i++){
			for(var k = 0, j = this._combs[i].length; k < j; k++){
				var index = this._combs[i][k],
					icon = this.icons[index];
				if ((icon.inV || icon.inH) && !icon.processed){
					this._shiftUpper(index);
					icon.processed = true;
				}
			}
		}
	},

	_shiftUpper : function(index){
		for(var i = index - this.cols, l = index % this.cols; i >= l; i = i - this.cols){
			var icon = this.icons[i];
			if(!icon.visible) continue;
			if(i in this._toMove){
				this._toMove[i].y += icon.width;
				this._toMove[i].index += this.cols;	
			}
			else{
				this._toMove[i] = {
					y : icon.y + icon.width,
					index : i + this.cols
				};
			}
		}
	},

	changeIndexes : function(){
		var keys = Object.keys(this._toMove);
		if(keys.length == 0) return;

		for(var i = keys.length - 1; i >= 0; i--){
			var n = keys[i],
				temp = this.icons[n],
				index = this._toMove[n].index;

			this.icons[n] = this.icons[index];
			this.icons[index]  = temp;
		}
		this._toMove = {};
	},

	addIcons : function(){
		for(var i = 0; i < this.icons.length; i++){
			if(!this.icons[i].visible){
				var rnd = Math.floor(Math.random() * this.game.global.iconNames.length),
					txt = this.game.global.iconNames[rnd],
					x = this.game.global.offsetX + (i % this.cols) * this.icons[i].width,
					y = this.game.global.offsetY + Math.floor(i / this.cols) * this.icons[i].width;

				this.icons[i].loadTexture(txt);
				this.icons[i].reset(x, y); 
			}
		}
	},

	moveIcons : function (fn) {
		if(Object.keys(this._toMove).length == 0) return fn();

		var tweenCallback = (function (self) {
			var completed = 0,
				l = Object.keys(self._toMove).length;

			return function () {
				completed++;
				if(completed == l){
					fn();
				}
			}
		}(this));

		for(var i in this._toMove){
			var t = this.game.add.tween(this.icons[i]).to({ y : this._toMove[i].y}, 1000);
			t.onComplete.add(tweenCallback, this);
			t.start();
		}
	},

	defaultValues : function(){
		for(var i = 0, l = this.icons.length; i < l; i++){
			this.icons[i].inV = false;
			this.icons[i].inH = false;
			this.icons[i].processed = false;
		}

		this._combs = []; 
	},

	createMap : function () {
		for(var i = 0, l = this.icons.length; i < l; i++){
			var row = Math.floor(i / this.cols),
				col = i % this.cols,
				down = i + this.cols,
				right = i + 1;

			if(down > this.rows * this.cols) down = false;

			if(Math.floor(right / this.cols) > row) right = false;

			this.map[i] = {
				right : right,
				down : down
			}
		}
	}
}

playState.Sequence = function (game) {
	this.game = game;
	this.elements = [];
	for(var i = 0, l = game.global.sequenceLength; i < l; i++){
		var x = game.global.width / 2 - game.global.iconSize * 3 + i * game.global.iconSize,
			y = game.global.height - game.global.offsetY / 2 - game.global.iconSize / 2,
			name = game.global.iconNames[Math.floor(Math.random() * game.global.iconNames.length)];

		this.elements[i] = game.add.image(x, y, name);
		this.elements[i].scale.x = this.elements[i].scale.y = (game.global.iconSize / game.global.imageSize).toFixed(3);
	}
}

playState.Sequence.prototype.shift = function(){
	for(var i = 1, l = this.elements.length; i < l; i++){
		var txt = this.elements[i].key;
		this.elements[i - 1].loadTexture(txt);
	}

	var name = game.global.iconNames[Math.floor(Math.random() * game.global.iconNames.length)];
	this.elements[this.elements.length - 1].loadTexture(name);
}