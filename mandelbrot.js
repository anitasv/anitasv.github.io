
class Complex {

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    multiply(c2) {
        let x = this.x;
        let y = this.y;
        return new Complex(x * c2.x - y * c2.y, x * c2.y + y * c2.x);
    }

    abs2() {
        let x = this.x;
        let y = this.y;
        return x * x + y * y;
    }

    add(c2) {
        let x = this.x;
        let y = this.y;
        return new Complex(x + c2.x, y + c2.y);
    }
}

class Color {
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
    add(that) {
        return new Color(this.r + that.r, 
                         this.g + that.g, 
                         this.b + that.b);
    }
    subtract(that) {
        return new Color(this.r - that.r, 
            this.g - that.g, 
            this.b - that.b);
    }
    scale(lambda) {
        return new Color(this.r * lambda, 
                         this.g * lambda, 
                         this.b * lambda)
    }
    round() {
        return new Color(Math.round(this.r),
                         Math.round(this.g),
                         Math.round(this.b))
    }
}

function test(candidate) {
    let counter = 0;
    let z = new Complex(0, 0);
    while (z.abs2() < 4) {
        z = z.multiply(z).add(candidate);
        counter++;
        if (counter > 5000) {
            return counter;
        }
    }
    return counter + (1 + 4.0 / z.abs2());
}

function main(md, ctx, level) {
    var imageData = ctx.getImageData(0, 0, md.width, md.height);
    var data = imageData.data;

    ctx.strokeRect(0, 0, md.width, md.height);

    const canvasWidth = 800;
    const canvasHeight = 800;

    const superSample = 2;

    const scanWidth = superSample * canvasWidth;
    const scanHeight = superSample * canvasHeight;
    var highres = new Array(scanWidth * scanHeight);

    const centerX = -0.743643887037158704752191506114774;
    const centerY = 0.131825904205311970493132056385139;
    const zoom = scanWidth * level;

    for (let i = 0; i <= scanWidth; i++) {
        for (let j = 0; j <= scanHeight; j++) {
            const k = (i * scanHeight + j);
            const y = (i - scanWidth/2)/zoom + centerY;
            const x = (j - scanHeight/2)/zoom + centerX;
            const c = new Complex(x, y);
            const color = test(c);
            highres[k] = color;
        }
    }


    function getColorDiscrete(counter) {
        // return new Color(counter % 3 * 80,
        //     counter % 5 * 50, 
        //     counter % 7 * 36)
        if (counter <= 3) {
            return new Color(counter * 255/3, 0, 0);
        } else if (counter <= 9) {
            return new Color(0, counter * 255/9, 0);
        } else if (counter <= 27) {
            return new Color(0, 0, counter * 255/27);
        } else if (counter <= 81) {
            return new Color(0, counter * 255/81, counter * 255/81);
        } else if (counter <= 175) {
            return new Color(counter * 255/175, 0, counter * 255/175);
        }  else if (counter <= 200) {
            return new Color(counter * 255/200, counter * 255/200, 0);
        } else {
            return new Color(counter, counter, counter);
        }
    }

    function getColor(counter) {
        const ctr = counter;
        const c1 = getColorDiscrete(Math.floor(ctr));
        const c2 = getColorDiscrete(Math.floor(ctr) + 1);
        const lambda = ctr - Math.floor(ctr);
        return c1.scale(1 - lambda).add(c2.scale(lambda));
    }

    let dither = new Color(0, 0, 0);

    for (let i = 0; i <= canvasWidth; i++) {
        for (let j = 0; j <= canvasHeight; j++) {
            let total = new Color(0, 0, 0);
            for (let si = 0; si < superSample; si++) {
                for (let sj = 0; sj < superSample; sj++) {
                    let ii = (i * superSample) + si;
                    let jj = (j * superSample) + sj;
                    let kk = (ii * scanHeight + jj);
                    total = total.add(getColor(highres[kk]));
                }
            }
            let mean = total.scale(1.0/(superSample * superSample));
            let choose = dither.add(mean).round();
            dither = dither.add(mean).subtract(choose);

            let k = (i * md.width + j) * 4;
            
            data[k] = choose.r;
            data[k + 1] = choose.g;
            data[k + 2] = choose.b;
            data[k + 3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);
}


const md = document.getElementById('mandel');
const ctx = md.getContext("2d");
let level = 50;
function draw() {
    main(md, ctx, level);
    level = level * 1.25;
    console.log(level);
    // requestAnimationFrame(draw);
}

draw();