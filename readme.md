#### Bugs in the original VB.NET interpreter:
1. `D` performs addition instead of division.
2. Without `S` insn at (0,0) is not executed.
3. Spec says `&` and `$` should work on curent value, but they work on current number in the VB interpreter (see hello world).
   I consider this bug in spec, fixed on [wiki].
4. `F` is defined as both finish and false, VB interpreter treats it as finish.
   I consider this bug in spec, removed `F` as false on [wiki].
5. `~` doesn't produce any noticable delay.

#### Differences between VB and JS interps:
0. I didn't reproduce bugs #1 and #2.
1. JS interp when run on nodejs supports both interactive and non-interactive input; VB interp supports only interactive input.
2. Interactive input works differently: in VB interp a keypress is inputted immediately, in JS interp you have to press Enter.
3. JS interp understands Windows and UNIX line endings, VB interp understands only Windows line endings.

#### Similarities:
1. Both interps treat chars beyond BMP as two chars.

[wiki]: https://esolangs.org/wiki/RunR
