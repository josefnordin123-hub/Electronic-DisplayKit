/*
 * DIY Display Kit — bench proof-of-concept firmware (sprint-roadmap.md Week 1)
 * ==============================================================================
 *
 * WHAT THIS PROVES: GC9A01 round display + LVGL bring-up works on real ESP32
 * hardware (or at least, is wired up correctly enough to attempt it). That's
 * the specific Week 1 "Rapid Prototyper" deliverable per the roadmap.
 *
 * WHAT THIS IS NOT: the WebSerial command parser/dispatcher. That's Week 3,
 * roadmap Tasks 2.3-2.5, and needs (a) the real prototype unit in hand,
 * (b) the finalized protocol schema (/protocol/schema.json or .ts — didn't
 * exist yet when this was written, see the note above pollSerialForWidgetCommands()),
 * and (c) the actual WebSerial SPA to test the wire format against. The
 * serial-reading code below is a structural stub, clearly marked with TODOs
 * — it is NOT a working protocol implementation. Do not wire it into
 * anything customer-facing as-is.
 *
 * NOT COMPILED OR HARDWARE-TESTED IN THIS SESSION. There was no physical
 * ESP32+GC9A01 unit and no PlatformIO toolchain available in this
 * environment. Every pin number, timing value, and LVGL API call below is
 * written from documentation/reference-design knowledge, not from a
 * successful build. See /firmware/README.md for the full list of what
 * needs real-hardware verification before this is trusted.
 */

#include <Arduino.h>
#include <ArduinoJson.h>
#include <LovyanGFX.hpp>
#include <lvgl.h>

// ---------------------------------------------------------------------
// Display driver: LovyanGFX config for a GC9A01 round panel over SPI.
// (See platformio.ini for why LovyanGFX was picked over Arduino_GFX.)
//
// !!! PIN MAPPING BELOW IS AN UNVERIFIED PLACEHOLDER !!!
// These are common ESP32-devkit + GC9A01-module wiring values seen in
// reference designs — NOT confirmed against this project's actual
// prototype unit. Task 3.2 (pinout reference doc) does not exist yet.
// Whoever has the physical board: check the real wiring loom first,
// update every `pin_*` value below to match, THEN attempt a build.
// ---------------------------------------------------------------------
class LGFX : public lgfx::LGFX_Device {
    lgfx::Panel_GC9A01 _panel_instance;
    lgfx::Bus_SPI _bus_instance;

public:
    LGFX(void) {
        {  // SPI bus config
            auto cfg = _bus_instance.config();
            cfg.spi_host = VSPI_HOST;
            cfg.spi_mode = 0;
            cfg.freq_write = 40000000;
            cfg.freq_read = 16000000;
            cfg.spi_3wire = false;
            cfg.use_lock = true;
            cfg.dma_channel = 1;
            cfg.pin_sclk = 18;  // TODO: verify against real wiring (Task 3.2)
            cfg.pin_mosi = 23;  // TODO: verify against real wiring (Task 3.2)
            cfg.pin_miso = -1;  // GC9A01 modules are typically write-only (no MISO)
            cfg.pin_dc = 2;     // TODO: verify against real wiring (Task 3.2)
            _bus_instance.config(cfg);
            _panel_instance.setBus(&_bus_instance);
        }
        {  // Panel config
            auto cfg = _panel_instance.config();
            cfg.pin_cs = 5;    // TODO: verify against real wiring (Task 3.2)
            cfg.pin_rst = 4;   // TODO: verify against real wiring (Task 3.2)
            cfg.pin_busy = -1;
            cfg.panel_width = 240;
            cfg.panel_height = 240;
            cfg.offset_x = 0;
            cfg.offset_y = 0;
            cfg.readable = false;
            cfg.invert = true;  // Most GC9A01 modules need color inversion — verify on real panel
            cfg.rgb_order = false;
            cfg.dlen_16bit = false;
            cfg.bus_shared = false;
            _panel_instance.config(cfg);
        }
        setPanel(&_panel_instance);
    }
};

static LGFX gfx;

// Backlight enable pin — many GC9A01 modules need this driven HIGH
// explicitly; some tie BL straight to 3V3 and need no GPIO at all.
// TODO: verify against real wiring (Task 3.2) — this may not even apply.
static const int PIN_BACKLIGHT = 15;

// ---------------------------------------------------------------------
// LVGL plumbing
// ---------------------------------------------------------------------
static const uint16_t SCREEN_W = 240;
static const uint16_t SCREEN_H = 240;

static lv_disp_draw_buf_t draw_buf;
// Partial draw buffer (10 rows) rather than a full-frame buffer — keeps
// RAM usage sane on an ESP32. TODO: tune row count once real frame-rate
// behavior is observed on hardware; this value is an untested guess.
static lv_color_t buf1[SCREEN_W * 10];

static void lvgl_flush_cb(lv_disp_drv_t *disp, const lv_area_t *area, lv_color_t *color_p) {
    uint32_t w = (area->x2 - area->x1 + 1);
    uint32_t h = (area->y2 - area->y1 + 1);

    gfx.startWrite();
    gfx.setAddrWindow(area->x1, area->y1, w, h);
    gfx.writePixels((uint16_t *)&color_p->full, w * h);
    gfx.endWrite();

    lv_disp_flush_ready(disp);
}

// Builds the bench-test UI: a text label plus an arc, so a mis-mapped
// offset/rotation on a round panel is visually obvious (not just "is
// anything drawing at all").
static void build_bench_test_ui() {
    lv_obj_t *scr = lv_scr_act();
    lv_obj_set_style_bg_color(scr, lv_color_black(), 0);

    lv_obj_t *label = lv_label_create(scr);
    lv_label_set_text(label, "GC9A01 + LVGL\nbench test OK");
    lv_obj_set_style_text_color(label, lv_color_white(), 0);
    lv_obj_set_style_text_align(label, LV_TEXT_ALIGN_CENTER, 0);
    lv_obj_center(label);

    lv_obj_t *arc = lv_arc_create(scr);
    lv_obj_set_size(arc, 200, 200);
    lv_arc_set_rotation(arc, 270);
    lv_arc_set_bg_angles(arc, 0, 360);
    lv_arc_set_value(arc, 70);
    lv_obj_center(arc);
    lv_obj_clear_flag(arc, LV_OBJ_FLAG_CLICKABLE);
}

// ---------------------------------------------------------------------
// Serial protocol — WEEK 1 STUB ONLY, NOT THE REAL PARSER.
//
// This is NOT roadmap Tasks 2.3-2.5. Those need the real prototype unit,
// the finalized protocol schema, and the actual WebSerial SPA to
// integration-test against — none of which are available at Week 1.
//
// The envelope shapes below are copied directly from
// project-docs/architecture-stack-proposal.md §3, because /protocol/
// (schema.json or schema.ts) does not exist in the repo yet at the time
// this was written — another agent may be authoring it concurrently.
// IF /protocol/schema.json or /protocol/schema.ts EXISTS BY THE TIME
// YOU'RE READING THIS AND WORKING FROM IT: re-check this stub against
// that schema instead of this comment — the schema is the source of
// truth per architecture-stack-proposal.md §3 point 5, this comment is
// a Week-1 stand-in for it.
//
// Handshake (device -> host, intended to be sent once on connect):
//   { "protocolVersion": "1.0", "deviceType": "gc9a01-round",
//     "shape": "round", "resolutionPx": [240, 240],
//     "colorDepth": "rgb565",
//     "supports": ["text", "image", "widget:clock", "widget:gauge"] }
//
// Widget payload (host -> device):
//   { "protocolVersion": "1.0", "type": "widget",
//     "widget": "gauge", "params": { "min": 0, "max": 100, "label": "CPU" } }
// ---------------------------------------------------------------------

static void sendHandshake() {
    // Builds and prints a capability descriptor matching the shape above.
    // This part is real/functional (ArduinoJson serialization actually
    // runs) — what's UNVERIFIED is the wire framing itself: this assumes
    // the host expects a single newline-terminated JSON line on connect,
    // with no ack/checksum. That assumption has NOT been checked against
    // the WebSerial SPA's actual connect-flow code (Task 2.2). Confirm
    // before relying on it.
    //
    // Also note: "supports" below only lists "text", NOT "image" or
    // "widget:*" — because this firmware doesn't implement those
    // pipelines yet (Week 3, Tasks 2.4-2.5). Advertising capabilities
    // the firmware can't yet honor would break the frontend's
    // capability-driven renderer selection described in
    // architecture-stack-proposal.md §3, point 2. Update this list only
    // as each capability is actually implemented.
    StaticJsonDocument<256> doc;
    doc["protocolVersion"] = "1.0";
    doc["deviceType"] = "gc9a01-round";
    doc["shape"] = "round";
    JsonArray res = doc.createNestedArray("resolutionPx");
    res.add(SCREEN_W);
    res.add(SCREEN_H);
    doc["colorDepth"] = "rgb565";
    JsonArray supports = doc.createNestedArray("supports");
    supports.add("text");
    // TODO: add "image", "widget:clock", "widget:gauge" once those
    // pipelines exist and are hardware-verified (Week 3).

    serializeJson(doc, Serial);
    Serial.println();
}

static void pollSerialForWidgetCommands() {
    // TODO (Week 3, roadmap Tasks 2.3-2.5): this function is a stub, not
    // a parser. A real implementation needs at minimum:
    //   - A confirmed framing strategy (newline-delimited JSON is assumed
    //     here — verify against what the WebSerial SPA actually writes)
    //   - protocolVersion validation / version-mismatch handling
    //   - "type" dispatch across whatever message types the finalized
    //     /protocol/schema.json|ts ends up defining (text config, image
    //     config, widget config, disconnect handling per Task 2.7)
    //   - Actually mapping "widget" + "params" onto live LVGL objects —
    //     right now build_bench_test_ui() only ever runs once at boot;
    //     there is no update path from a received command to the screen
    //   - Malformed-JSON / unknown-widget-type / out-of-range-param
    //     handling
    //   - Some ack sent back to the host, so Task 2.2's connect flow and
    //     the Reality Check Gate's "device-acknowledged, not just
    //     didn't-throw" bar (sprint-roadmap.md Phase 4 gate criteria)
    //     can actually be met
    //
    // What IS real below: reading a line off Serial and confirming it
    // parses as JSON via ArduinoJson, so the library wiring itself is
    // proven — it just doesn't do anything with the result yet beyond a
    // debug echo.

    if (!Serial.available()) return;

    String line = Serial.readStringUntil('\n');
    if (line.length() == 0) return;

    StaticJsonDocument<512> doc;
    DeserializationError err = deserializeJson(doc, line);
    if (err) {
        Serial.print("[stub] JSON parse failed: ");
        Serial.println(err.c_str());
        return;
    }

    // TODO: replace this debug echo with real dispatch — see TODOs above.
    Serial.print("[stub] parsed envelope, type=");
    Serial.println(doc["type"] | "(none)");
}

// ---------------------------------------------------------------------
static uint32_t lastTickMs = 0;

void setup() {
    Serial.begin(115200);
    delay(200);  // let USB-serial settle on some boards before first writes

    pinMode(PIN_BACKLIGHT, OUTPUT);
    digitalWrite(PIN_BACKLIGHT, HIGH);

    gfx.init();
    gfx.setRotation(0);  // TODO: verify orientation against real panel + enclosure cutout

    lv_init();
    lv_disp_draw_buf_init(&draw_buf, buf1, nullptr, SCREEN_W * 10);

    static lv_disp_drv_t disp_drv;
    lv_disp_drv_init(&disp_drv);
    disp_drv.hor_res = SCREEN_W;
    disp_drv.ver_res = SCREEN_H;
    disp_drv.flush_cb = lvgl_flush_cb;
    disp_drv.draw_buf = &draw_buf;
    lv_disp_drv_register(&disp_drv);

    build_bench_test_ui();

    sendHandshake();

    lastTickMs = millis();
}

void loop() {
    uint32_t now = millis();
    lv_tick_inc(now - lastTickMs);
    lastTickMs = now;

    lv_timer_handler();

    pollSerialForWidgetCommands();  // stub — see TODOs above, does not update the UI yet

    delay(5);
}
