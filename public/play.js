var playState = {
	create : function(){

		this.setIconSize(game.global);

		var icons = this.initIcons(game);

		this.board = this.initBoard(game, icons);

		this.sequence = this.initSequence(game);

		this.bonusLoader = this.initLoader(game);

		this.bonusGen = this.initBonusSet(game);

		var self = this;

		this.board.onTurnFinished(function (res) {
			self.bonusLoader.add(res.points * res.combo);
		});

		this.bonusLoader.onLoaderfilled(function (res) {
			self.bonusGen.add();
		})

		this.bonusGen.onBonusClicked(function (key){
			if (key == 'reverse') self.sequence.reverse();
			else if (key == 'even') self.sequence.changeOverOne(1);
			else if (key == 'odd') self.sequence.changeOverOne(0);
			//else if (key = 'x2') double points
		});

		this.board.makeTurn();

		this.tapped = false;
	},

	update : function () {
		if(game.input.activePointer.isDown){
			var relX = game.input.activePointer.x - game.global.offsetX,
				relY = game.input.activePointer.y - game.global.offsetY;

			if(relY < 0 || relX < 0 || game.time.now - this.tapped < game.global.tapDelay) return;

			var index = Math.floor(relY / game.global.iconSize) * game.global.cols + Math.floor(relX / game.global.iconSize);

			this.insertIcon(index);
			this.tapped = game.time.now;
		}
	},

	insertIcon : function(index){
		var txt = this.sequence.getFirstKey();
		this.board.insertIcon(index, txt);
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
	}
}

playState.initIcons = function (game) {
	var iconScale = (game.global.iconSize / game.global.imageSize).toFixed(3),
		cols = game.global.cols,
		icons = [];

	for(var i = 0, q = game.global.rows * cols; i < q; i++){
		var x = Math.floor(game.global.offsetX + game.global.iconSize * (i % cols)),
			y = Math.floor(game.global.offsetY + game.global.iconSize * Math.floor(i / cols)),
			left = false, 
			up = false;

		if(i % cols > 0){
			left = icons[i - 1].key;
		}
		if(Math.floor(i / cols) > 0){
			up = icons[i - cols].key;
		}

		var name = getName(left, up);

		icons[i] = game.add.sprite(x, y, name, 3);
		icons[i].scale.x = icons[i].scale.y = iconScale;

		icons[i].animations.add('create', [0, 1, 2, 3], 12);

		game.physics.arcade.enable(icons[i]);
	}

	function getName (){
		var args = Array.prototype.slice.call(arguments);

		return getRand();

		function getRand (){
			var n = Math.floor(Math.random() * game.global.iconNames.length);
			if(args.indexOf(game.global.iconNames[n]) == -1) return game.global.iconNames[n];
			return getRand();
		}
	}

	return icons;
}

playState.initLoader = function () {
	var loader = game.add.sprite(game.global.offsetX, game.global.offsetX, game.global.loaderName);	

		pointsMax = game.global.initialCapacity,
		points = 99;

		setFraction();

		function setFraction(){
			pointSize = (game.global.width - game.global.offsetX * 2) / pointsMax;
		}

		return {
			add : function (ps) {
				loader.width += pointSize * ps;
				points += ps;
				if(points > pointsMax){
					this.onLoaderfilled();
					loader.scale.x = 1;
					pointsMax += 10;
					points = 0;
					setFraction();
				}
			},

			onLoaderfilled : (function () {
				var callback;
				return function (arg){
					if(!callback) callback = arg;
					else return callback();
				}
			}())
		}
}

playState.initBonusSet = function (game) {
	var bonus1, bonus2;

	function getBonusName(){
		return game.global.bonusNames[Math.floor(Math.random() * game.global.bonusNames.length)];
	}

	return {
		onBonusClicked : (function () {
			var callback;
			return function (arg) {
				if(!callback) callback = arg;
				else {
					bonus1.visible = bonus2.visible = false;
					return callback(this.key);
				} 

			}
		}()),

		add : function () {
			bonus1 = game.add.button(game.global.width / 2 - game.global.bonusWidth * 1.5, game.global.offsetX * 2, getBonusName()),
			bonus2 = game.add.button(game.global.width / 2 + game.global.bonusWidth / 2, game.global.offsetX * 2, getBonusName());

			bonus1.onInputDown.add(this.onBonusClicked, bonus1);
			bonus2.onInputDown.add(this.onBonusClicked, bonus2);
		}
	}
}


playState.initBoard = function (game, icons) {
	var	cols = game.global.cols,
		rows = game.global.rows,
		combs = [],
		toMove = [],
		combo = 0,
		points = 0,
		map = {};

		(function createMap () {
			for(var i = 0, l = icons.length; i < l; i++){
				var row = Math.floor(i / cols),
				col = i % cols,
				down = i + cols,
				right = i + 1;

				if(down >= rows * cols) down = false;

				if(Math.floor(right / cols) > row) right = false;

				map[i] = {
					right : right,
					down : down
				}
			}
		}());

		function killThreesomes (fn){

			for(var i = 0, l = icons.length; i < l; i++){
				if (l - i > cols * 2){
					checkComb(i, 'down');
				}
				if (i % cols < cols - 2){
					checkComb(i, 'right');
				}
			}

			if(combs.length === 0) return;

			for(var i = 0, l = combs.length; i < l; i++){
				var index = combs[i];
				icons[index].visible = false;
			}
			fn();
		}

		function checkComb (i, dir){
			var current = [],
				hasComb = true;

			current.push(i);

			while(hasComb){
				var prev = icons[i],
				index = map[i][dir],
				icon = icons[index];

				if (icon.key == prev.key){
					current.push(index);
					if(!map[index][dir]) hasComb = false;
				}	
				else {
					hasComb = false;
				}
				i = index;
			}

			if(current.length > 2){
				for(var i = 0, l = current.length; i < l; i++){
					var index = current[i];
					if(combs.indexOf(index) === -1) combs.push(index);
				}
			}
		}

		function computeMovements (){
			for(var i = 0, l = combs.length; i < l; i++){
				shiftUpper(combs[i]);
			}
		}

		function shiftUpper (index) {
			for(var i = index - cols, l = index % cols; i >= l; i = i - cols){
				var icon = icons[i];
				if(!icon.visible) continue;
				if(i in toMove){
					toMove[i].y += icon.width;
					toMove[i].index += cols;	
				}
				else{
					toMove[i] = {
						y : icon.y + icon.width,
						index : i + cols
					};
				}
			}
		}

		function changeIndexes (){
			var keys = Object.keys(toMove);
			if(keys.length == 0) return;

			for(var i = keys.length - 1; i >= 0; i--){
				var n = keys[i],
					temp = icons[n],
					index = toMove[n].index;

				icons[n] = icons[index];
				icons[index]  = temp;
			}
			toMove = {};
		}

		function addIcons (fn){
			var addCallback = callback(fn, combs.length);

			for(var i = 0, l = icons.length; i < l; i++){
				if(!icons[i].visible){
					var x = game.global.offsetX + (i % cols) * icons[i].width,
						y = game.global.offsetY + Math.floor(i / cols) * icons[i].width,
						left = false, 
						down = false;

					if(i % cols > 0){
						left = icons[i - 1].key;
					}
					if(Math.floor(i / cols) < 7){
						down = icons[i + cols].key;
					}

					var txt = getName(left, down);

					icons[i].loadTexture(txt);
					icons[i].reset(x, y); 

					var anim = icons[i].animations.getAnimation('create');
					anim.onComplete.add(addCallback.fn, addCallback);
					anim.play();
				}
			}
		}

		function moveIcons (fn){
			if(Object.keys(toMove).length == 0) return fn();

			var tweenCallback = callback(fn, Object.keys(toMove).length);

			for(var i in toMove){
				var time = (toMove[i].y - icons[i].y) / game.global.speed,
					t =  game.add.tween(icons[i]).to({ y : toMove[i].y}, time * 300);

				t.onComplete.add(tweenCallback.fn, tweenCallback);
				t.start();
			}
		}

		function callback (fn, max) {
			return {
				signals : max, 
				fn : (function () {
					var invoked = 0;
					return function () {
						if(++invoked == this.signals) return fn();
					}
				}())
			}
		}

		function getName (){
			var args = Array.prototype.slice.call(arguments);

			return getRand();

			function getRand (){
				var n = Math.floor(Math.random() * game.global.iconNames.length);
				if(args.indexOf(game.global.iconNames[n]) == -1) return game.global.iconNames[n];
				return getRand();
			}
		}

		return {
			makeTurn : function () {
				var self = this;

				killThreesomes(function () {
					points += combs.length;
					combo += 1;
					computeMovements();

					moveIcons(function () {
						changeIndexes();
						addIcons(function(){

							self.onTurnFinished({
								points : points, 
								combo : combo
							});

							combo = 0;
							points = 0;
							combs = [];

							self.makeTurn(); 
						});
					});

				});
			},

			onTurnFinished : (function(){
				var callback;
				return function(arg){
					if(!callback) callback = arg;
					else callback(arg);
					
				}
			}()),

			insertIcon : function (index, txt) {
				icons[index].loadTexture(txt, 3);
			}
		}
}

playState.initSequence = function (game) {
	var elements = [];
	for(var i = 0, l = game.global.sequenceLength; i < l; i++){
		var x = game.global.width / 2 - game.global.iconSize * 3 + i * game.global.iconSize,
			y = game.global.height - game.global.offsetY / 2 - game.global.iconSize / 2,
			name = game.global.iconNames[Math.floor(Math.random() * game.global.iconNames.length)];

		elements[i] = game.add.image(x, y, name, 3);
		elements[i].scale.x = elements[i].scale.y = (game.global.iconSize / game.global.imageSize).toFixed(3);
	}

	return {
		shift : function (){
			for(var i = 1, l = elements.length; i < l; i++){
				var txt = elements[i].key;
				elements[i - 1].loadTexture(txt, 3);
			}

			var name = game.global.iconNames[Math.floor(Math.random() * game.global.iconNames.length)];
			elements[elements.length - 1].loadTexture(name, 3);
		},

		getFirstKey : function () {
			return elements[0].key;
		},

		changeOverOne : function (s) {
			for(var i = s, l = elements.length; i < l; i += 2){
				var n = Math.floor(Math.random() * 4);
				elements[i].loadTexture(game.global.iconNames[n], 3);
			}		
		},

		reverse : function () {
			var keys = [];
			for(var i = elements.length - 1, l = 0; i >= l; i--){
				keys.push(elements[i].key);
			}
			for(var i = 0, l = elements.length; i < l; i++){
				elements[i].loadTexture(keys[i], 3);
			}
		}
	}
}