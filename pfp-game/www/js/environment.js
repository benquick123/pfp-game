function Environment (scene) {
    this.scene = scene;
    
    this.playerSprite = "character-0";
    this.playerHeight = 24;
    this.playerXOffset = 210;
    this.player = undefined;
    this.playerBounce = 0;
    this.playerBoundsOffset = -2;
    this.playerAnimationFPS = 12;

    this.groundYOffset = 128;
    this.groundFloorImage = "floor-0";
    this.groundUnderImage = "underground-0";
    this.groundImageDimension = 8;
    this.grounds = scene.add.group();
    this.backgroundImage = [["background-0", "background-1", "background-2", "background-3", "background-4", "background-5", "background-6", "background-7"]];
    this.backgroundImageSpawner = ["sequential"];
    this.backgroundIndex = [2];
    this.backgroundImageWidth = 128;
    this.parallaxScrollFactor = 1.0;
    this.backgrounds = [];
    this.customBackgroundPipeline = false;

    this.customPipelineWasMadeBefore = false;

    this.isStopped = true;

    this.gravity = 500;
    this.currSpeed = 0;
    
    this.musicName = "";
    this.music = undefined;

    this.score = 0;
    this.scoreText = undefined;

    this.colliderMagicNumber = 16
    this.leftCollider = new Phaser.Physics.Arcade.Sprite(this.scene, 0, -this.colliderMagicNumber).setOrigin(0, 0);
    this.leftCollider.height = gridHeight + 2*this.colliderMagicNumber;
    this.leftCollider.x = -this.leftCollider.width-2*this.colliderMagicNumber;
    this.scene.add.existing(this.leftCollider);
    this.scene.physics.add.existing(this.leftCollider);

    this.extraLeftCollider = new Phaser.Physics.Arcade.Sprite(this.scene, 0, -this.colliderMagicNumber).setOrigin(0, 0);
    this.extraLeftCollider.height = gridHeight + 2*this.colliderMagicNumber;
    this.extraLeftCollider.x = -this.leftCollider.width-this.backgroundImageWidth;
    this.scene.add.existing(this.extraLeftCollider);
    this.scene.physics.add.existing(this.extraLeftCollider);

    this.rightCollider = new Phaser.Physics.Arcade.Sprite(this.scene, 0, -this.colliderMagicNumber).setOrigin(0, 0);
    this.rightCollider.height = gridHeight + 2*this.colliderMagicNumber;
    this.rightCollider.x = gridHeight*ratio + this.rightCollider.width + 4*this.colliderMagicNumber;
    this.scene.add.existing(this.rightCollider);
    this.scene.physics.add.existing(this.rightCollider);

    this.bottomCollider = new Phaser.Physics.Arcade.Sprite(this.scene, -this.colliderMagicNumber, gridHeight+this.colliderMagicNumber).setOrigin(0, 0);
    this.bottomCollider.width = gridHeight * ratio * 2 * this.colliderMagicNumber;
    this.bottomCollider.x = -this.colliderMagicNumber;
    this.scene.add.existing(this.bottomCollider);
    this.scene.physics.add.existing(this.bottomCollider)

    this.addPlayer = function(x, y) {
        this.player = this.scene.physics.add.sprite(x, y, this.playerSprite); 
        this.player.setBounce(this.playerBounce);
        this.player.setGravityY(this.gravity);
        this.player.body.setSize(this.player.body.width-6, this.player.body.height);
    }

    this.addAnimations = function () {
        this.scene.anims.remove("playeridle");
        this.scene.anims.remove("playerwalk");
        this.scene.anims.remove("playerjump");
        this.scene.anims.remove("playertalk");

        this.scene.anims.create({
            key: 'playeridle',
            frames: this.scene.anims.generateFrameNumbers(this.playerSprite, { start: 0, end: 0 }),
            frameRate: this.playerAnimationFPS,
            repeat: 0
        });

        this.scene.anims.create({
            key: 'playerwalk',
            frames: this.scene.anims.generateFrameNumbers(this.playerSprite + "-walk", { start: 0, end: 8 }),
            frameRate: this.playerAnimationFPS,
            repeat: -1
        });

        this.scene.anims.create({
            key: "playerjump",
            frames: this.scene.anims.generateFrameNumbers(this.playerSprite + "-jump", { start: 0, end: 0}),
            frameRate: 8,
            repeat: 0
        });
        this.scene.anims.create({
            key: "playertalk",
            frames: this.scene.anims.generateFrameNumbers(this.playerSprite + "-talk", {start: 0, end: 4}),
            frameRate: 12,
            repeat: -1
        });
    }

    this.addGroundColumn = function (x, y) {
        var onOutOfBounds = function(objectA, objectB) {
            objectA.destroy();
        }

        var floor = this.scene.physics.add.image(x, y, this.groundFloorImage);
        this.scene.physics.add.collider(this.player, floor);
        this.scene.physics.add.overlap(floor, this.leftCollider, onOutOfBounds);

        floor.body.setVelocityX(-this.currSpeed);
        floor.body.setImmovable();
        floor.body.setFriction(0);

        this.grounds.add(floor);

        for (var i=y+this.groundImageDimension; i<=gridHeight; i+=this.groundImageDimension) {
            var underground = this.scene.physics.add.sprite(x, i, this.groundUnderImage);
            this.scene.physics.add.overlap(underground, this.leftCollider, onOutOfBounds);

            underground.body.setVelocityX(-this.currSpeed);
            this.grounds.add(underground);
        }
    }
    
    this.addGround = function (startX, startY) {
        for (var i=startX; i<=gridHeight*ratio+4*this.groundImageDimension; i+=this.groundImageDimension) {
            this.addGroundColumn(i, startY)
        }
    }

    this.addBackgroundColumn = function (i, x, y) {
        var onOutOfBounds = function(objectA, objectB) {
            objectA.destroy();
        }

        var backgroundImageI = Math.floor(Math.random() * this.backgroundImage[i].length);
        if (this.backgroundImageSpawner[i] == "sequential") {
            backgroundImageI = this.backgroundIndex[i] % this.backgroundImage[i].length;
            this.backgroundIndex[i]++;
        }
        var background = this.scene.physics.add.sprite(x, y, this.backgroundImage[i][backgroundImageI]);
        background.setOrigin(0);
        background.setDepth(-(i+1)*10);
        this.scene.physics.add.overlap(background, this.extraLeftCollider, onOutOfBounds);

        background.body.setVelocityX(-this.currSpeed * Math.pow(this.parallaxScrollFactor, i+1));

        if (this.customBackgroundPipeline) {
            this.createBackgroundShader();
            background.setPipeline("custom-pipeline");
        }

        this.backgrounds[i].add(background);
    }
    
    this.addBackground = function (i) {
        this.backgrounds.push(this.scene.add.group());

        var newChildPosition = 0;
        while (newChildPosition < gridHeight*ratio + 16) {
            this.addBackgroundColumn(i, newChildPosition, 0);
            var backgroundChildren = this.backgrounds[i].getChildren();
            lastChild = backgroundChildren[backgroundChildren.length-1];
            newChildPosition = lastChild.x + lastChild.width;
        }
    }

    this.initializeEnv = function () {
        this.addPlayer(gridHeight*ratio - this.playerXOffset, -this.playerHeight);
        for (var i = 0; i < this.backgroundImage.length; i++) {
            this.addBackground(i);
        }
        this.addGround(0, this.groundYOffset);

        this.score = 0;
        this.scoreText = this.scene.add.bitmapText(10, 10, "font20", this.score);
        this.scoreText.setVisible(false);
        this.scoreText.setFontSize(24);
        this.scoreText.setLetterSpacing(2);
    }

    this.stopGameplay = function () {
        this.isStopped = true;

        var groundChildren = this.grounds.getChildren();
        for (var i = 0; i < groundChildren.length; i++) {
            groundChildren[i].body.setVelocityX(0);
        }
        
        for (var i = 0; i < this.backgrounds.length; i++) {
            var backgroundChildren = this.backgrounds[i].getChildren();
            for (var j = 0; j < backgroundChildren.length; j++) {
                backgroundChildren[j].body.setVelocityX(0);
            }
        }

        this.player.anims.stop();
        this.player.anims.play("playeridle");
    }

    this.resumeGameplay = function (fromBeginning, animationsOnly) {
        this.isStopped = false;

        if (fromBeginning) {
            this.currSpeed = this.initSpeed;
        }

        var groundChildren = this.grounds.getChildren();
        for (var i = 0; i < groundChildren.length; i++) {
            groundChildren[i].body.setVelocityX(-this.currSpeed);
        }

        for (var i = 0; i < this.backgrounds.length; i++) {
            var backgroundChildren = this.backgrounds[i].getChildren();
            for (var j = 0; j < backgroundChildren.length; j++) {
                backgroundChildren[j].body.setVelocityX(-this.currSpeed * Math.pow(this.parallaxScrollFactor, i+1));
            }
        }

        if (!animationsOnly) {    
            var obstaclesChildren = this.obstacles.getChildren();
            for (var i = 0; i < obstaclesChildren.length; i++) {
                obstaclesChildren[i].body.setVelocityX(-this.currSpeed);
            }
            this.addObstacle(gridHeight*ratio + this.obstacleStartingXOffset, this.groundYOffset-this.groundImageDimension/2-this.obstacleHeight/2 + this.obstacleStartingYOffset);
            this.addEnemyObject(gridHeight*ratio+this.enemyDimension/2, Math.random()*(this.enemyYRange[1]-this.enemyYRange[0]) + this.enemyYRange[0]);
        }
        
        this.player.anims.stop();
        this.player.anims.play("playerwalk", true);
    }

    this.updateGameplayDifficulty = function () {

    }

    this.createBackgroundShader = function () {
        if (!this.customPipelineWasMadeBefore) {
            var config = {
                game: this.scene.game,
                renderer: this.scene.game.renderer,
                fragShader: `
                /*
                * Original shader from: https://www.shadertoy.com/view/4dGGRK
                */

                #ifdef GL_ES
                precision mediump float;
                #endif

                // glslsandbox uniforms
                uniform float time;
                uniform vec2 resolution;

                // shadertoy globals
                #define iTime time
                #define iResolution resolution

                // Emulate a black texture
                #define texture(s, uv) vec4(0.0)

                // --------[ Original ShaderToy begins here ]---------- //
                /*
                    Thanks to fb39ca4 for this shader: https://www.shadertoy.com/view/4dX3zl

                    I've copied it and then plugged in my own distance functions in getVoxel.

                    Additionally I've added a basic lighting system. I've commented my changes.
                */

                /*	------------------------- SETTINGS ------------------------- */
                // Dither the entire screen for a fun effect
                //#define DITHERING
                // Whether you want 
                //#define CAMERAROTATING



                /*	------------------------ /SETTINGS/ ------------------------ */




                // function to generate a rotation matrix. Very handy!
                mat3 rotationMatrix(vec3 axis, float angle)
                {
                    axis = normalize(axis);
                    float s = sin(angle);
                    float c = cos(angle);
                    float oc = 1.0 - c;
                    
                    return mat3(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
                                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
                                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c);
                }

                //The raycasting code is somewhat based around a 2D raycasting toutorial found here: 
                //http://lodev.org/cgtutor/raycasting.html

                const int MAX_RAY_STEPS = 170;


                // For different distance functions, look here: https://www.shadertoy.com/view/Xds3zN
                float sdSphere(vec3 p, float d) { return length(p) - d; } 

                float sdBox( vec3 p, vec3 b )
                {
                vec3 d = abs(p) - b;
                return min(max(d.x,max(d.y,d.z)),0.0) +
                        length(max(d,0.0));
                }

                float sdTorus( vec3 p, vec2 t )
                {
                return length( vec2(length(p.xz)-t.x,p.y) )-t.y;
                }

                float sdCapsule( vec3 p, vec3 a, vec3 b, float r )
                {
                    vec3 pa = p-a, ba = b-a;
                    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
                    return length( pa - ba*h ) - r;
                }

                // this function returns true if there's a bool in the provided grid position.
                bool getVoxel(ivec3 c, mat3 rotMat1, mat3 rotMat2) 
                {
                    vec3 p = vec3(c) + vec3(0.5);
                    // Generate 2 rotation matrices for the 
                    float d = min(min(sdTorus(rotMat1*vec3(c), vec2(10,3)),sdTorus(rotMat2*vec3(c), vec2(25,4))), -sdSphere(p, 50.0));
                    
                    #define CAPSULEDIST (0.0 + abs(sin(iTime))*13.0)
                    d = min(d, sdCapsule(rotMat1*vec3(c), vec3(0,CAPSULEDIST,0), vec3(0,-CAPSULEDIST,0), 4.0));
                    return d < 0.0;
                }

                vec2 rotate2d(vec2 v, float a) {
                    float sinA = sin(a);
                    float cosA = cos(a);
                    return vec2(v.x * cosA - v.y * sinA, v.y * cosA + v.x * sinA);	
                }

                #ifdef DITHERING
                float dither(vec2 position, float brightness) {
                    float bayer = texture(iChannel0, position).r;
                    return step(bayer, brightness-0.1);
                }
                #endif

                void mainImage( out vec4 fragColor, in vec2 fragCoord )
                {
                    vec2 uv = ((fragCoord.xy * 2.0) / iResolution.xy) - vec2(1);	// Make UV go from -1 to 1 instead of 0 to 1
                    uv.x *= iResolution.x / iResolution.y;
                    
                    vec3 s = vec3(sin(iTime*0.1)*45.0,sin(iTime*0.4)*15.0,cos(iTime*0.1)*45.0);
                    #define FOCALLEN 0.6
                    vec3 d = vec3(uv*FOCALLEN, 1.0);
                    mat3 rotMat = rotationMatrix(vec3(0,1,sin(iTime*3.14159*0.1)*-0.3), -iTime*0.1 + 3.14159) * rotationMatrix(vec3(1,0,0), -0.4*sin(iTime*0.4) - 0.0);
                    d = rotMat * d;
                    
                    vec3 rayDir = d;
                    vec3 rayPos = s;
                    
                    
                    ivec3 mapPos = ivec3(floor(rayPos + 0.));

                    vec3 deltaDist = abs(vec3(length(rayDir)) / rayDir);
                    
                    ivec3 rayStep = ivec3(sign(rayDir));

                    vec3 sideDist = (sign(rayDir) * (vec3(mapPos) - rayPos) + (sign(rayDir) * 0.5) + 0.5) * deltaDist; 
                    
                    bvec3 mask;
                    mat3 rotMat1 = rotationMatrix(vec3(1,1,0), iTime*0.3);
                    mat3 rotMat2 = rotationMatrix(vec3(1,1,0), iTime*0.2);
                    
                    for (int i = 0; i < MAX_RAY_STEPS; i++) 
                    {
                        //if (getVoxel(mapPos)) continue;
                        bvec3 b1 = lessThan(sideDist.xyz, sideDist.yzx);
                        bvec3 b2 = lessThanEqual(sideDist.xyz, sideDist.zxy);
                        mask.x = b1.x && b2.x;
                        mask.y = b1.y && b2.y;
                        mask.z = b1.z && b2.z;
                        //Would've done mask = b1 && b2 but the compiler is making me do it component wise.
                        
                        //All components of mask are false except for the corresponding largest component
                        //of sideDist, which is the axis along which the ray should be incremented.			
                        
                        if(getVoxel(mapPos, rotMat1, rotMat2)) break;
                        sideDist += vec3(mask) * deltaDist;
                        mapPos += ivec3(mask) * rayStep;
                    }

                    /*
                        Basic lighting
                        I calculate the distance from the current voxel center (mapPos) to a given light.
                    */
                    
                    fragColor = vec4(0,0,0,1);	// Thanks otaviogood
                    
                    #define POW2(a) (a*a)
                    
                    #define CENTERCOLOR (vec3(0,0.4,0.8) * clamp(cos(-iTime*2.0)*1.4-0.4, -0.1, 1.) )
                    fragColor.rgb += ( 1.0/POW2(distance(vec3(0,0,0), rotMat*vec3(mapPos))) ) * 100.0 * CENTERCOLOR;
                    
                    #define MEDROTCOLOR vec3(0.1,0.5,0)
                    rotMat = rotationMatrix(vec3(1,1,0), iTime*0.2);
                    fragColor.rgb += ( 1.0/POW2(distance(vec3(sin(iTime)*25.0,0,cos(iTime)*25.0), rotMat*vec3(mapPos))) ) * 20.0 * MEDROTCOLOR;
                    fragColor.rgb += ( 1.0/POW2(distance(vec3(sin(-iTime)*25.0,0,cos(iTime)*25.0), rotMat*vec3(mapPos))) ) * 20.0 * MEDROTCOLOR;
                    
                    #define CAPSULECOLOR (vec3(1,0,1)*(-cos(iTime*2.0)*0.5+0.5))
                    //#define CAPSULEDIST (10.0 + sin(iTime)*5.0) Actually defined further up
                    rotMat = rotationMatrix(vec3(1,1,0), iTime*0.3);
                    fragColor.rgb += ( 1.0/POW2(distance(vec3(0, CAPSULEDIST+1.0,0), rotMat*vec3(mapPos))) ) * 10.0 * CAPSULECOLOR;
                    fragColor.rgb += ( 1.0/POW2(distance(vec3(0,-CAPSULEDIST+1.0,0), rotMat*vec3(mapPos))) ) * 10.0 * CAPSULECOLOR;
                    
                    #define RIMCOLOR vec3(0,0.1,0.3) * max(0.0, sin(atan(float(mapPos.z), float(mapPos.x))*5.0+iTime*5.0)) * step(30.0, length(vec3(mapPos))) * (1.0-smoothstep(20., 50., abs(float(mapPos.y))))
                    fragColor.rgb += clamp(( 1.0/abs(sdTorus(vec3(mapPos - ivec3(0,0,0)), vec2(50.0,20)) )), 0., 1.0) * 5.0 * RIMCOLOR;
                    
                    #define OUTROTSPEED 0.2
                    #define OUTROTRADIUS 45.0
                    #define OUTROTBRIGHTNESS 100.0
                    #define OUTROTCOLOR vec3(1,0.4,0)
                    fragColor.rgb += ( 1.0/POW2(distance(vec3( sin(iTime*OUTROTSPEED)*OUTROTRADIUS,0, cos(iTime*OUTROTSPEED)*OUTROTRADIUS), vec3(mapPos))) ) * OUTROTBRIGHTNESS * OUTROTCOLOR;
                    fragColor.rgb += ( 1.0/POW2(distance(vec3( cos(iTime*OUTROTSPEED)*OUTROTRADIUS,0,-sin(iTime*OUTROTSPEED)*OUTROTRADIUS), vec3(mapPos))) ) * OUTROTBRIGHTNESS * OUTROTCOLOR;
                    fragColor.rgb += ( 1.0/POW2(distance(vec3(-sin(iTime*OUTROTSPEED)*OUTROTRADIUS,0,-cos(iTime*OUTROTSPEED)*OUTROTRADIUS), vec3(mapPos))) ) * OUTROTBRIGHTNESS * OUTROTCOLOR;
                    fragColor.rgb += ( 1.0/POW2(distance(vec3(-cos(iTime*OUTROTSPEED)*OUTROTRADIUS,0, sin(iTime*OUTROTSPEED)*OUTROTRADIUS), vec3(mapPos))) ) * OUTROTBRIGHTNESS * OUTROTCOLOR;
                    
                    #ifdef DITHERING
                    fragColor.r = dither(fragCoord.xy / vec2(8), fragColor.r);
                    fragColor.g = dither(fragCoord.xy / vec2(8), fragColor.g);
                    fragColor.b = dither(fragCoord.xy / vec2(8), fragColor.b);
                    #endif

                }
                // --------[ Original ShaderToy ends here ]---------- //

                void main(void)
                {
                    mainImage(gl_FragColor, gl_FragCoord.xy);
                    gl_FragColor.a = 1.0;
                }`
            };
            var customPipeline = new Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline(config);
            this.filter = this.scene.game.renderer.addPipeline("custom-pipeline", customPipeline);
            this.customPipelineWasMadeBefore = true;
        }
    }
}

/* 
#ifdef GL_ES
                precision mediump float;
                #endif
                
                #extension GL_OES_standard_derivatives : enable
                
                uniform float time;
                uniform vec2 resolution;
    
                void main( void ) {
    
                    vec2 position = ( gl_FragCoord.xy / resolution.xy ) - vec2(0.5, 0.5);
                    gl_FragColor = vec4(position, 1, 2);
                    float t = 3e1 + sin(time)*10.; // reminds me of Starry Night
                    for( int i = 0; i < 7; i++) {
                        gl_FragColor += vec4(sin(gl_FragColor.y*t/ 50.0), sin(gl_FragColor.x*11.3+cos(time)), 0., 1.0);
                    }
                    gl_FragColor = length(gl_FragColor)*0.01+0.1*gl_FragColor;
                }

                #ifdef GL_ES
                precision mediump float;
                #endif

                #extension GL_OES_standard_derivatives : enable

                uniform float time;
                uniform vec2 mouse;
                uniform vec2 resolution;

                void main( void ) {

                    vec2 position = ( gl_FragCoord.xy / resolution.xy ) + mouse / 4.0;

                    float color = 0.0;
                    color += sin( position.x * cos( time / 15.0 ) * 80.0 ) + cos( position.y * cos( time / 15.0 ) * 10.0 );
                    color += sin( position.y * sin( time / 10.0 ) * 40.0 ) + cos( position.x * sin( time / 25.0 ) * 40.0 );
                    color += sin( position.x * sin( time / 5.0 ) * 10.0 ) + sin( position.y * sin( time / 35.0 ) * 80.0 );
                    color *= sin( time / 10.0 ) * 0.5;

                    gl_FragColor = vec4( vec3( color, color * 0.5, sin( color + time / 3.0 ) * 0.75 ), 1.0 );
                    //   
                }
*/ 