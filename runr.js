// This is a nodejs interpreter for https://esolangs.org/wiki/RunR
// author: stasoid; released to public domain

var fs = require('fs');

if (process.argv.length <= 2) {
	console.log("Usage: node runr.js <file>");
	process.exit(-1);
}
var code = fs.readFileSync(process.argv[2], 'utf-8');

putchar = ch => process.stdout.write(ch);
//putchar = ch => output += ch; // version for browser

// https://stackoverflow.com/a/64235311
// This needs Enter, unlike original interp.
// Original interp doesn't support non-interactive input, errors out when <file
// This function behaves as TIO's brainfuck, returns 0 on EOF.
// Note: on EOF readSync returns "\0".
function getchar() 
{
	let buffer = Buffer.alloc(1);
	fs.readSync(0, buffer, 0, 1);
	return buffer.toString('utf-8');
}
/*Version for browser:
function getchar() 
{
	let ch;
	if(input == "") ch = "\0";
	else {
		ch = input[0];
		input = input.slice(1);
	}
	return ch;
}*/

// this produces different sound than original interp
beep = () => process.stderr.write('\7');

let dbglog;
//dbglog = console.log; // uncomment to enable logging

try {
	RunR(code, putchar, getchar, beep, dbglog);
}
catch(error) {
	console.error(error+'');
}


function RunR(code, putchar, getchar, beep, dbglog)
{
	code = code.split('\n');
	// remove \r in case of \r\n
	code.forEach((line,i) => line.at(-1)=='\r' ? code[i] = line.slice(0,-1) : 0);
	let width = code.reduce((result,line) => Math.max(result,line.length), 0); // width of longest line

	let pos = find_start(code) || {x: 0, y: 0};
	let dir = {dx: 1, dy: 0};
	let stack = [];
	let mstack = []; // matrix stack
	let num = 0; // current number
	// the program S3TO prints \3, which suggests that "current value" is not the same as "current number"
	let val = false; // current value
	
	function find_start(code)
	{
		for (let y = code.length - 1; y >= 0; y--)
		{
			let x = code[y].lastIndexOf('S');
			if (x != -1) return {x,y};
		}
	}

	function get(pos)
	{
		if(!(pos.y >= 0 && pos.y < code.length)) return null;
		if(!(pos.x >= 0 && pos.x < width)) return null;
		return code[pos.y][pos.x] ?? ' ';
	}

	function pop(stack)
	{
		let num = stack.pop();
		if(num === undefined) throw `Stack underflow at ${get(pos)} (${pos.x},${pos.y})`;
		return num;
	}
	
	function clip(num)
	{
		if(num < 0) return 0;
		if(num > 255) return 255;
		return num;
	}

	function advance(pos)
	{
		pos.x += dir.dx;
		pos.y += dir.dy;
	}

	function log_state()
	{
		if(!dbglog) return;
		dbglog(`${get(pos)} (${pos.x},${pos.y}) num=${num} stk=[${stack}] mstk=[${mstack}] val=${val}`);
	}

	while(1)
	{
		log_state();
		let ch = get(pos);
		switch(ch)
		{
			case 'S':
			case ' ':
			case '~': // I didn't notice any delay in the original interp, so it is noop here.
				break;

			case 'F':  return;
			case null: return; // ran over the edge of grid

			case 'I': num = clip(getchar().charCodeAt(0)); break;
			case 'O': putchar(String.fromCharCode(num)); break;

			case '^': stack.push(num); break;
			case 'v': num = pop(stack); break;
			case 'A': num = clip(num + pop(stack)); break;
			case 'U': num = clip(num - pop(stack)); break;
			case 'M': num = clip(num * pop(stack)); break;
			case 'D':
				// D instr doesn't work in the original interp, so we have to guess whether to use integer division or not.
				// From the spec: "When the current number goes below 0 or above 255, it simply stops at the high value."
				// This suggests that numbers are integers.
				// Note: clip(Infinity) == 255
				num = clip(Math.floor(num / pop(stack)));
				break;

			case'0':case'1':case'2':case'3':case'4':case'5':case'6':case'7':case'8':case'9':
				num = +ch;
				break;

			case '%': val = !num; break;
			// _bug in spec: these insns actually work on num, not on val (see hello world)
			case '$': num = pop(mstack); break;
			case '&': mstack.push(num); break;

			case '!': val = !val; break;
			case 'T': val = true; break;
			// _bug in spec: F is already used for finish
			//case 'F': val = false; break;

			case '(': dir = {dx: 1, dy:0}; break; // ->  (see Cat.runr)
			case ')': dir = {dx:-1, dy:0}; break; // <-

			// dx,dy -> dx,dy
			//  1, 0 ->  0,-1
			// -1, 0 ->  0, 1
			//  0, 1 -> -1, 0
			//  0,-1 ->  1, 0
			case '/': dir = {dx: -dir.dy, dy: -dir.dx}; break;
			// dx,dy -> dx,dy
			//  1, 0 ->  0, 1
			// -1, 0 ->  0,-1
			//  0, 1 ->  1, 0
			//  0,-1 -> -1, 0
			case '\\': dir = {dx: dir.dy, dy: dir.dx}; break;

			case '|': dir.dx = -dir.dx; break;
			case '-': dir.dy = -dir.dy; break;

			case '+':          dir = {dx: -dir.dx, dy: -dir.dy}; break;
			case '#': if(!val) dir = {dx: -dir.dx, dy: -dir.dy}; break;

			case '@': if(val) advance(pos); break;

			// dx,dy -> dx,dy  turn left
			//  1, 0 ->  0,-1
			//  0,-1 -> -1, 0
			// -1, 0 ->  0, 1
			//  0, 1 ->  1, 0
			case '<': dir = {dx: dir.dy, dy: -dir.dx}; break;
			// dx,dy -> dx,dy  turn right
			//  1, 0 ->  0, 1
			//  0, 1 -> -1, 0
			// -1, 0 ->  0,-1
			//  0,-1 ->  1, 0
			case '>': dir = {dx: -dir.dy, dy: dir.dx}; break;

			case '*': beep(); break;

			default: throw `Invalid instruction at ${get(pos)} (${pos.x},${pos.y})`;
		}
		advance(pos);
	}
	
	throw 'Unreachable code';
}
