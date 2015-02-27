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
	tapDelay : 500,
	initialCapacity : 100,
	increment : 10,
	loaderName : 'dot'
}

game.global.iconNames = ['circle', 'triangle', 'square', 'pentagon'];