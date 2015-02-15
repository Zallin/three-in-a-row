var playState = {
	create : function(){
		this.board = new this.Board(game.global);

		for(var r = 0, nr = game.global.difficulty[1]; r < nr; r = r + 1){
			this.board.icons[r] = [];
			for(var c = 0, nc = game.global.difficulty[0]; c < nc; c = c + 1){
				var rnd = Math.floor(Math.random() * 4);
				if(r > 0){
					if(this.board.icons[r - 1][c].name === game.global.iconNames[rnd]){
						rnd = this.Icon.getRand(rnd);
					} 
				}
				if(c > 0){
					if(this.board.icons[r][c - 1].name === game.global.iconNames[rnd]){
						rnd = this.Icon.getRand(rnd);
					} 
				}
				this.board.icons[r][c] = new this.Icon(game.global, rnd, r, c);
				var icon = game.add.image(this.board.icons[r][c].x, this.board.icons[r][c].y, this.board.icons[r][c].name);
				icon.scale.x = icon.scale.y = this.board.icons[r][c].scale;
			}
		}
	},

	update : function(){

	}
}

playState.Board = function(){
	this.icons = [];
}

playState.Board.prototype = {
	killThreesomes : function(){

	}
}

playState.Icon = function(global, rnd, r, c){
	this._size = Math.floor(global.width * (1 - global.boardOffset * 2) / global.difficulty[0]);
	this.scale = (this._size / global.imageSize).toFixed(3);
	this.name = global.iconNames[rnd];

	this.x = Math.floor(global.boardOffset * global.width + this._size * c);
	this.y = Math.floor((global.height - this._size * global.difficulty[1]) * 0.5 + this._size * r);
}

playState.Icon.getRand = function(prev){
	var rnd = Math.floor(Math.random() * 4);
	if(rnd === prev) return this.getRand(rnd);
	return rnd;
}