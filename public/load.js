var loadState = {
	preload : function(){
		game.stage.backgroundColor = '#f4f4f4';

		game.physics.startSystem(Phaser.Physics.ARCADE);

		game.load.image('circle', 'circle.png');
		game.load.image('square', 'square.png');
		game.load.image('pentagon', 'pentagon.png');
		game.load.image('triangle', 'triangle.png');
		game.load.image('dot', 'dot.png');
	},

	create : function(){
		game.state.start('play');
	}
}