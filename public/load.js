var loadState = {
	preload : function(){
		game.stage.backgroundColor = '#f4f4f4';

		game.physics.startSystem(Phaser.Physics.ARCADE);

		game.load.spritesheet('circ1', 'circ1.png', 64, 64);
		game.load.spritesheet('oct1', 'oct1.png', 64, 64);
		game.load.spritesheet('oct2', 'oct2.png', 64, 64);
		game.load.spritesheet('oct3', 'oct3.png', 64, 64);
		game.load.spritesheet('tr1', 'tr1.png', 64, 64);
		game.load.spritesheet('tr2', 'tr2.png', 64, 64);
		game.load.image('dot', 'dot.png');
		game.load.image('x2', 'x2.png');
		game.load.image('even', 'even.png');
		game.load.image('odd', 'odd.png');
		game.load.image('reverse', 'reverse.png');
	},

	create : function(){
		game.state.start('play');
	}
}