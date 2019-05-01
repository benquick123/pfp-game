const glsl = x => x;


function CustomShaders(scene) {
    this.scene = scene;
    this.shadersTime = 0;

    this.backgroundShader0 = this.scene.game.renderer.getPipeline("backgroundShader0");
    if (this.backgroundShader0 == null) {
        var config = {
            game: this.scene.game,
            renderer: this.scene.game.renderer,
            fragShader: glsl`
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
        
        this.backgroundShader0 = this.scene.game.renderer.addPipeline("backgroundShader0", customPipeline);
    }

    this.backgroundShader1 = this.scene.game.renderer.getPipeline("backgroundShader1");
    if (this.backgroundShader1 == null) {
        var config = {
            game: this.scene.game,
            renderer: this.scene.game.renderer,
            fragShader: glsl`
            /*
            * Original shader from: https://www.shadertoy.com/view/ltSGDh
            */

            #ifdef GL_ES
            precision mediump float;
            #endif

            // glslsandbox uniforms
            uniform float time;
            uniform vec2 resolution;

            // shadertoy emulation
            #define iTime time
            #define iResolution resolution

            // --------[ Original ShaderToy begins here ]---------- //
            const float pi = 3.14159;

            mat3 xrot(float t)
            {
                return mat3(1.0, 0.0, 0.0,
                            0.0, cos(t), -sin(t),
                            0.0, sin(t), cos(t));
            }

            mat3 zrot(float t)
            {
                return mat3(cos(t), -sin(t), 0.0,
                            sin(t), cos(t), 0.0,
                            0.0, 0.0, 1.0);
            }

            float sdCappedCylinder( vec3 p, vec2 h )
            {
            vec2 d = abs(vec2(length(p.xz),p.y)) - h;
            return min(max(d.x,d.y),0.0) + length(max(d,0.0));
            }

            float smin( float a, float b, float k )
            {
                float res = exp( -k*a ) + exp( -k*b );
                return -log( res )/k;
            }

            float map(vec3 pos, float q)
            {
                float so = q;
                float sr = atan(pos.z,pos.x);
                so += pos.y * 0.5;
                so += sin(pos.y*55.0+sr-iTime) * 0.005;
                so += sin(pos.y*125.0+sr-iTime*10.0) * 0.004;
                //float ro = pos.y*10.0-iTime;
                //pos.xz += vec2(cos(ro), sin(ro)) * 0.07;
                float d = sdCappedCylinder(pos, vec2(so, 10.0));
                float k = pos.y;
                return smin(d,k,12.0);
            }

            vec3 surfaceNormal(vec3 pos)
            {
                vec3 delta = vec3(0.01, 0.0, 0.0);
                vec3 normal;
                normal.x = map(pos + delta.xyz,0.0) - map(pos - delta.xyz,0.0);
                normal.y = map(pos + delta.yxz,0.0) - map(pos - delta.yxz,0.0);
                normal.z = map(pos + delta.zyx,0.0) - map(pos - delta.zyx,0.0);
                return normalize(normal);
            }

            float trace(vec3 o, vec3 r, float q)
            {
                float t = 0.0;
                float ta = 0.0;
                for (int i = 0; i < 90; ++i)
                {
                    float d = map(o + r * t, q);
                    t += d*0.75;
                }
                return t;
            }

            void mainImage( out vec4 fragColor, in vec2 fragCoord )
            {
                vec2 uv = fragCoord.xy / iResolution.xy;
                uv = uv * 2.0 - 1.0;
                uv.x *= iResolution.x / iResolution.y;
                
                vec3 r = normalize(vec3(uv, 1.0));

                r *= zrot(sin(time*0.5)*0.2) * xrot(-pi*0.05+sin(time*0.1)*0.1);
                
                vec3 o = vec3(0.0, 0.15, -0.5);
                
            //    float t = trace(o, r, 0.0);
                float t = trace(o, r, 0.0+sin(time)*0.05);

                vec3 world = o + r * t;
                vec3 sn = surfaceNormal(world);
                
                vec3 vol = vec3(0.0);
                
                float prod = max(dot(sn, -r), 0.0);
                
                float fd = map(world, 0.0);
                float fog = 1.0 / (0.1 + t * t * 2.0 + fd * 100.0);
                
                vec3 sky = vec3(50.0,50.0,50.0) / 255.0;
                
                vec3 fgf = vec3(210.0,180.0,140.0) / 255.0;
                vec3 fgb = vec3(129.0,69.0,19.0) / 255.0;
                vec3 fg = mix(fgb, fgf, prod);
                
                vec3 back = mix(fg, sky, 1.0-fog);
                
                vec3 mmb = mix(vol, back, 0.8);
                
                vec3 fc = mmb * vec3(1.0);
                
                fragColor = vec4(fc, 1.0);
            }
            // --------[ Original ShaderToy ends here ]---------- //

            void main(void)
            {
                mainImage(gl_FragColor, gl_FragCoord.xy);
            }
            `
        };
        var customPipeline = new Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline(config);
        
        this.backgroundShader1 = this.scene.game.renderer.addPipeline("backgroundShader1", customPipeline);
    }

    this.trailShader = this.scene.game.renderer.getPipeline("trailShader");
    if (this.trailShader == null) {
        config = {
            game: this.scene.game,
            renderer: this.scene.game.renderer,
            fragShader: [
                "precision mediump float;",

                //"in" attributes from our vertex shader
                "varying vec4 outColor;",
                "varying vec2 outTexCoord;",

                //declare uniforms
                "uniform sampler2D u_texture;",
                "uniform float resolution;",
                "uniform float radius;",
                "uniform vec2 dir;",
                "uniform float time;",

                "void main() {",
                //this will be our RGBA sum
                "vec4 sum = vec4(0.0);",

                //our original texcoord for this fragment
                "vec2 tc = outTexCoord;",

                //the amount to blur, i.e. how far off center to sample from 
                //1.0 -> blur by one pixel
                //2.0 -> blur by two pixels, etc.
                "float blur = radius/resolution;",

                //the direction of our blur
                //(1.0, 0.0) -> x-axis blur
                //(0.0, 1.0) -> y-axis blur
                "float hstep = dir.x;",
                "float vstep = dir.y;",

                //apply blurring, using a 9-tap filter with predefined gaussian weights",

                /* "sum += texture2D(u_texture, vec2(tc.x - 4.0*blur*hstep, tc.y - 4.0*blur*vstep)) * 0.0162162162;",
                "sum += texture2D(u_texture, vec2(tc.x - 3.0*blur*hstep, tc.y - 3.0*blur*vstep)) * 0.0540540541;",
                "sum += texture2D(u_texture, vec2(tc.x - 2.0*blur*hstep, tc.y - 2.0*blur*vstep)) * 0.1216216216;",
                "sum += texture2D(u_texture, vec2(tc.x - 1.0*blur*hstep, tc.y - 1.0*blur*vstep)) * 0.1945945946;",*/

                "sum += texture2D(u_texture, vec2(tc.x, tc.y)) * 0.6;",

                "sum += texture2D(u_texture, vec2(tc.x + 1.0*blur*hstep, tc.y + 1.0*blur*vstep)) * 0.1945945946;",
                "sum += texture2D(u_texture, vec2(tc.x + 2.0*blur*hstep, tc.y + 2.0*blur*vstep)) * 0.1216216216;",
                "sum += texture2D(u_texture, vec2(tc.x + 3.0*blur*hstep, tc.y + 3.0*blur*vstep)) * 0.0540540541;",
                "sum += texture2D(u_texture, vec2(tc.x + 4.0*blur*hstep, tc.y + 4.0*blur*vstep)) * 0.0162162162;",

                "float c = 1.0 - cos(time) * radius;",
                "float s = 0.0 + sin(time) * radius;",
                "mat4 hueRotation = mat4(0.299, 0.587, 0.114, 0.0, 0.299, 0.587, 0.114, 0.0, 0.299, 0.587, 0.114, 0.0, 0.0, 0.0, 0.0, 1.0) + mat4(0.701, -0.587, -0.114, 0.0, -0.299, 0.413, -0.114, 0.0, -0.300, -0.588, 0.886, 0.0, 0.0, 0.0, 0.0, 0.0) * c + mat4(0.168, 0.330, -0.497, 0.0, -0.328, 0.035, 0.292, 0.0, 1.250, -1.050, -0.203, 0.0, 0.0, 0.0, 0.0, 0.0) * s;",
                //discard alpha for our simple demo,return
                "gl_FragColor = vec4(sum.rgb, 1.0) * hueRotation;",
                "}"

            ].join('\n')
        };

        var customPipeline = new Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline(config);

        this.trailShader = this.scene.game.renderer.addPipeline("trailShader", customPipeline);
        this.trailShader.setFloat1('resolution', gridHeight*ratio);
        this.trailShader.setFloat1('radius', 0.0);
        this.trailShader.setFloat2('dir', 0.0, 0.0);
    }

    this.distortionShader = this.scene.game.renderer.getPipeline("distortionShader");
    if (this.distortionShader == null) {
        config = {
            game: this.scene.game,
            renderer: this.scene.game.renderer,
            fragShader: glsl`
            precision mediump float;
            uniform float     time;
            uniform vec2      resolution;
            uniform sampler2D uMainSampler;
            varying vec2 outTexCoord;

            void main( void ) {
                vec2 uv = outTexCoord;
                uv.y += (sin((uv.x + (time * 0.5)) * 3.0) * 0.1) + (sin((uv.x + (time * 0.2)) * 4.0) * 0.01);
                vec4 texColor = texture2D(uMainSampler, uv);
                gl_FragColor = texColor;
            }`
        };

        var customPipeline = new Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline(config);

        this.distortionShader = this.scene.game.renderer.addPipeline("distortionShader", customPipeline);
    }

    this.blackHoleShader = this.scene.game.renderer.getPipeline("blackHoleShader");
    if (this.blackHoleShader == null) {
        var blackHoleCoordDef = "";
        for (var i = 0; i < 30; i++) {
            blackHoleCoordDef += "uniform vec2 hole_coord" + i + ";"
        }

        var blackHoleCalculationDef = "";
        for (var i = 0; i < 30; i++) {
            blackHoleCalculationDef += `
                if (hole_coord` + i + `.x != 0.0 && hole_coord` + i + `.y != 0.0) {
                    vec2 hole_coord = vec2(resolution.x - hole_coord` + i + `.x, hole_coord` + i + `.y);
                    mt = hole_coord` + i + `.xy/resolution;
                    mt_sum += mt;
                    dx = st.x - mt.x;
                    dy = (st.y - mt.y) / (resolution.x / resolution.y);
                    dist = sqrt(dx * dx + dy * dy);
                    pull = pull + mass / (dist * dist);
                }
                
                `
        }

        config = {
            game: this.scene.game,
            renderer: this.scene.game.renderer,
            fragShader:
            glsl`#ifdef GL_ES
            precision mediump float;
            #endif

            #define PI 3.14159265359

            uniform sampler2D u_image;
            varying vec2 v_texCoord;

            uniform vec2 resolution;` + 
            blackHoleCoordDef + 
            glsl`uniform float mass;
            uniform float time;
            uniform float n_holes;

            vec2 rotate(vec2 mt, vec2 st, float angle){
                float c = cos(angle * 0.5); // try replacing * 1.0 with * PI
                float s = sin(angle * 0.0); // try removing the * 0.0

                float nx = (c * (st.x - mt.x)) + (s * (st.y - mt.y)) + mt.x;
                float ny = (c * (st.y - mt.y)) - (s * (st.x - mt.x)) + mt.y;
                return vec2(nx, ny);
            }

            void main() {
                float pull = 0.0;
                float ratio = resolution.x / resolution.y;
                vec2 mt_sum = vec2(0.0, 0.0);
                vec2 coord = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
                vec2 st = coord / resolution; // calculate just once
                vec2 mt = vec2(0.0, 0.0);
                float dx = 0.0;
                float dy = 0.0;
                float dist = 0.0;` + 

                blackHoleCalculationDef +
            
                `vec3 color = vec3(0.0);
                
                vec2 r = rotate(mt_sum/n_holes, st, pull);
                vec4 imgcolor = texture2D(u_image, r);
                color = vec3(
                    (imgcolor.x - (pull * 0.25)),
                    (imgcolor.y - (pull * 0.25)), 
                    (imgcolor.z - (pull * 0.25))
                );
                
                gl_FragColor = vec4(color,1.);
            }`
        }
        var customPipeline = new Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline(config);
        this.blackHoleShader = this.scene.game.renderer.addPipeline("blackHoleShader", customPipeline);
        this.blackHoleShader.setFloat2("resolution", gridHeight*ratio, gridHeight);
        this.blackHoleShader.setFloat1("mass", 0.0);
        this.blackHoleShader.setFloat2("hole_coord0", 0.0, 0.0);
        this.blackHoleShader.setFloat1("n_holes", 1.0);
        for (var i = 1; i < 30; i++)
            this.blackHoleShader.setFloat2("hole_coord" + i, 0.0, 0.0);
    }
}