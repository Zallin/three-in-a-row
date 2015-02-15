var width = 414; 
var height = 736;

var game = new Phaser.Game(width, height, Phaser.AUTO, 'gameDiv');

game.state.add('load', loadState);
game.state.add('play', playState);

game.state.start('load');

game.global = {
	width : width,
	height : height,
	imageSize : 64,
	offsetX : 0.05 * this.width,
	offsetY : 0.15 * this.height,
	rows : 10,
	cols : 8,
	sequenceLength : 6,
	tapDelay : 500
}

game.global.setSize = function(){
		var size = Math.floor((this.height - this.offsetY * 2) / this.rows); 
		while(size * this.cols > this.width - this.offsetX * 2){
			size--;
		}
		this.offsetX = (this.width - size * this.cols) / 2;
		this.offsetY = (this.height - size * this.rows) / 2;
		this.size = size;
};

game.global.iconNames = ['circle', 'triangle', 'square', 'pentagon'];

game.global.setSize();