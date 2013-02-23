// WebMidiLink
window.addEventListener("message", webMidiLinkRecv, false);
function webMidiLinkRecv(event) {
    var msg = event.data.split(",");
    switch (msg[0]) {
        case "midi":
            switch (parseInt(msg[1], 16) & 0xf0) {
                case 0x80:
                    p.noteOff(parseInt(msg[2], 16));
                    break;
                case 0x90:
                    if (msg[3] > 0) {
                        p.noteOn(parseInt(msg[2], 16), msg[3] / 127);
                    } else
                        p.noteOff(parseInt(msg[2], 16));
                    break;
                case 0xb0:
                    if (parseInt(msg[2], 16) == 0x78) {
                        p.noteOff(parseInt(msg[2], 16));
                    }
                    break;
            }
            break;
    }
}
