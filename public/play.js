var playState = {
	create : function(){
		this.board = new this.Board(game);

		this.Icon.setSize(game.global.size);
		this.Icon.setScale(game.global.imageSize);

		var rows = game.global.rows, cols = game.global.cols;

		for(var i = 0, q = rows * cols; i < q; i++){
			var rnd = Math.floor(Math.random() * 4);
			if(i > cols - 1){
				if(this.board.icons[i - cols].name === game.global.iconNames[rnd]) rnd = this.Icon.getRandomName(rnd);
			}
			if(i % cols > 0){
				if(this.board.icons[i - 1].name === game.global.iconNames[rnd]) rnd = this.Icon.getRandomName(rnd);
			}
			var icon = this.board.icons[i] = new this.Icon(game.global, rnd, i),
				x = Math.floor(game.global.offsetX + icon.size * (i % cols)),
			 	y = Math.floor(game.global.offsetY + icon.size * Math.floor(i / cols));
			icon.image = game.add.sprite(x, y, icon.name);
			icon.image.scale.x = icon.image.scale.y = icon.scale;
			game.physics.arcade.enable(icon.image);
		}

		this.sequence = new this.Sequence(game);

		this.board.makeTurn();

		this.tapped = false;
	},

	update : function () {
		if(game.input.activePointer.isDown){
			if(game.time.now - this.tapped < game.global.tapDelay) return;
			var relX = game.input.activePointer.x - game.global.offsetX,
				relY = game.input.activePointer.y - game.global.offsetY,
				index = Math.floor(relY / game.global.size) * game.global.cols + Math.floor(relX / game.global.size);

			this.insertIcon(index);
			this.tapped = game.time.now;
		}
	},

	insertIcon : function(index){
		var txt = this.sequence.elements[0].key;
		this.board.icons[index].image.loadTexture(txt);
		this.board.icons[index].name = txt;
		this.sequence.shift();

		this.board.makeTurn();
	}
}

playState.Board = function(game){
	this.icons = [];
	this.cols = game.global.cols;

	this._combs = [];
	this._toMove = {};
	this.toAdd = {};
	this.game = game;
}

playState.Board.prototype = {
	makeTurn : function () {
		var self = this;
		this.killThreesomes();
		if(this._combs.length == 0) return;

		this.computeMovements(function () {
			self.moveIcons(function () {
				self.changeIndexes(function () {
					self.addIcons(function () {
						self.defaultValues();
						self.makeTurn();
					});
				});
			});
		});
	},

	killThreesomes : function(){
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
				this.icons[index].image.kill();
				this.icons[index].name = false;
			}
		}
	},

	_checkComb :  function(i, prop, dir){
		if (this.icons[i][prop]) return false;
		var current = [],
			hasComb = true;
		current.push(i);
		while(hasComb){
			var prev = this.icons[current[current.length - 1]],
				icon = this.icons[prev.next[dir]];
			if (icon.name == prev.name){
				current.push(prev.next[dir]);
				if(!icon.next[dir]) hasComb = false;
			}
			else {
				hasComb = false;
			}
		}
		if(current.length > 2){
			for(var i = 0, l = current.length; i < l; i++){
				var index = current[i];
				this.icons[index][prop] = true;
			}
			this._combs.push(current);
		}
	},

	computeMovements : function(fn){
		for(var i = 0, l = this._combs.length; i < l; i++){
			for(var k = 0, j = this._combs[i].length; k < j; k++){
				var index = this._combs[i][k],
					icon = this.icons[index];
				if ((icon.inV || icon.inH) && !icon.processed){
					this._shiftUpper(index, 1);
					icon.processed = true;
				}
			}
		}
		fn();
	},

	_shiftUpper : function(index, k){
		for(var i = index - this.cols, l = index % this.cols; i >= l; i = i - this.cols){
			var icon = this.icons[i];
			if(!icon.name) continue;
			if(i in this._toMove){
				this._toMove[i].y += k * icon.size;
			}
			else{
				this._toMove[i] = {
					y : icon.image.y + k * icon.size
				};
			}
		}
	},

	changeIndexes : function(fn){
		var keys = Object.keys(this._toMove);
		for(var i = keys.length - 1, l = 0; i >= l; i--){
			var n = keys[i], 
				x = this.icons[n].image.x - this.game.global.offsetX,
				y = this._toMove[n].y - this.game.global.offsetY,
				index = (Math.ceil(y / this.icons[n].size) * this.cols) + x / this.icons[n].size,
				temp = this.icons[index].image;
			
			this.icons[index].name = this.icons[n].name;
			this.icons[index].image = this.icons[n].image;

			this.icons[n].name = false;
			this.icons[n].image = temp;
		}
		this._toMove = {};
		fn();
	},

	addIcons : function(fn){
		for(var i = 0; i < this.icons.length; i++){
			if(!this.icons[i].name){
				var rnd = Math.floor(Math.random() * 4),
					x = this.game.global.offsetX + (i % this.cols) * this.icons[i].size,
					y = this.game.global.offsetY + Math.floor(i / this.cols) * this.icons[i].size;

				this.icons[i].name = this.game.global.iconNames[rnd];
				this.icons[i].image.loadTexture(this.icons[i].name);
				this.icons[i].image.reset(x, y);
			}
		}
		fn();
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
			var t = this.game.add.tween(this.icons[i].image).to({ y : this._toMove[i].y}, 1000);
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
		this.toAdd = [];
	}
}

playState.Icon = function(global, rnd, i){
	this.name = global.iconNames[rnd];

	var col = i % global.cols,
		row = Math.floor(i / global.cols),
		nextHor = i + 1,
		nextVert = i + global.cols;

	if(col === global.cols - 1) nextHor = false; 
	if(row === global.rows - 1) nextVert = false;

	this.next = {
		down : nextVert,
		right : nextHor
	};

	this.inH = false;
	this.inV = false;
	this.processed = false;
}

playState.Icon.setSize = function(size){
	this.prototype.size = size; 
}

playState.Icon.setScale = function(imageSize){
	this.prototype.scale = (this.prototype.size / imageSize).toFixed(3);
}

playState.Icon.getRandomName = function(prev){
	var rnd = Math.floor(Math.random() * 4);
	if(rnd === prev) return this.getRandomName(rnd);
	return rnd;
}

playState.Sequence = function (game) {
	this.game = game;
	this.elements = [];
	for(var i = 0, l = game.global.sequenceLength; i < l; i++){
		var x = game.global.width / 2 - game.global.size * 3 + i * game.global.size,
			y = game.global.height - game.global.offsetY / 2 - game.global.size / 2,
			name = game.global.iconNames[Math.floor(Math.random() * 4)];

		this.elements[i] = game.add.image(x, y, name);
		this.elements[i].scale.x = this.elements[i].scale.y = (game.global.size / game.global.imageSize).toFixed(3);
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