/*
 * lv_conf.h — LVGL v8.4 configuration, trimmed to what this Week-1 bench
 * PoC actually needs (display init + a label + an arc widget).
 *
 * HONESTY NOTE: this is NOT the full official lv_conf_template.h shipped
 * with LVGL — it's a hand-trimmed subset covering the macros this PoC's
 * main.cpp touches, based on the LVGL v8.4 template from memory. It has
 * NOT been build-verified against whatever exact lvgl version PlatformIO
 * actually resolves from lib_deps in this session (no toolchain available
 * here). If the build errors on an undefined macro:
 *   1. Find the real template PlatformIO fetched, usually at
 *      .pio/libdeps/esp32dev/lvgl/lv_conf_template.h
 *   2. Copy it over this file, set the top `#if 0` to `#if 1` to enable it
 *   3. Re-apply the settings below that are marked "// PROJECT:" — those
 *      are the ones that matter for this PoC (color depth, widgets used,
 *      tick handling), everything else can stay at template defaults.
 */

#ifndef LV_CONF_H
#define LV_CONF_H

#include <stdint.h>

/*====================
   COLOR SETTINGS
 *====================*/
#define LV_COLOR_DEPTH 16          // PROJECT: matches GC9A01 rgb565 panels
#define LV_COLOR_16_SWAP 0         // PROJECT: flip to 1 if colors look byte-swapped on real hardware

/*=========================
   MEMORY SETTINGS
 *=========================*/
#define LV_MEM_CUSTOM 0
#if LV_MEM_CUSTOM == 0
    #define LV_MEM_SIZE (48U * 1024U)   // PROJECT: fine for a single-screen demo; revisit if heap gets tight
#endif

#define LV_MEM_ADR 0
#define LV_MEMCPY_MEMSET_STD 0

/*====================
   HAL SETTINGS
 *====================*/
#define LV_DISP_DEF_REFR_PERIOD 30
#define LV_INDEV_DEF_READ_PERIOD 30

#define LV_TICK_CUSTOM 0
// PROJECT: tick is driven manually via lv_tick_inc() in main.cpp's loop(),
// not via LV_TICK_CUSTOM — see the TODO in main.cpp if this ever needs to
// move to a hardware timer/ISR for smoother timing.

#define LV_DPI_DEF 130

/*=======================
 * FEATURE CONFIGURATION
 *=======================*/

#define LV_USE_LOG 1
#if LV_USE_LOG
    #define LV_LOG_LEVEL LV_LOG_LEVEL_WARN
    #define LV_LOG_PRINTF 1   // routes LVGL logs to printf/Serial — useful on the bench
#endif

#define LV_USE_ASSERT_NULL 1
#define LV_USE_ASSERT_MALLOC 1
#define LV_USE_ASSERT_STYLE 0
#define LV_USE_ASSERT_MEM_INTEGRITY 0
#define LV_USE_ASSERT_OBJ 0

#define LV_USE_PERF_MONITOR 0
#define LV_USE_MEM_MONITOR 0
#define LV_USE_REFR_DEBUG 0

/*=====================
 *  COMPILER SETTINGS
 *====================*/
#define LV_BIG_ENDIAN_SYSTEM 0
#define LV_ATTRIBUTE_TICK_INC
#define LV_ATTRIBUTE_TIMER_HANDLER
#define LV_ATTRIBUTE_FLUSH_READY
#define LV_ATTRIBUTE_MEM_ALIGN_SIZE 1
#define LV_ATTRIBUTE_MEM_ALIGN
#define LV_ATTRIBUTE_LARGE_CONST
#define LV_ATTRIBUTE_LARGE_RAM_ARRAY
#define LV_ATTRIBUTE_FAST_MEM
#define LV_ATTRIBUTE_DMA
#define LV_EXPORT_CONST_INT(int_value) struct _silence_gcc_warning

#define LV_USE_LARGE_COORD 0

/*==================
 *   FONT USAGE
 *===================*/
#define LV_FONT_MONTSERRAT_14 1              // PROJECT: default font for the bench label
#define LV_FONT_DEFAULT &lv_font_montserrat_14
#define LV_FONT_FMT_TXT_LARGE 0
#define LV_USE_FONT_COMPRESSED 0
#define LV_USE_FONT_PLACEHOLDER 1

/*=================
 *  TEXT SETTINGS
 *=================*/
#define LV_TXT_ENC LV_TXT_ENC_UTF8
#define LV_TXT_BREAK_CHARS " ,.;:-_"
#define LV_TXT_LINE_BREAK_LONG_LEN 0
#define LV_TXT_COLOR_CMD "#"
#define LV_USE_BIDI 0
#define LV_USE_ARABIC_PERSIAN_CHARS 0

/*==================
 *  WIDGET USAGE — PROJECT: only what main.cpp actually creates, plus
 *  LV_USE_LABEL/LV_USE_ARC's usual dependencies. Add more here (e.g.
 *  LV_USE_IMG, LV_USE_METER) once Task 2.4/2.5's widget set gets built
 *  against this firmware in Week 3.
 *==================*/
#define LV_USE_ARC 1
#define LV_USE_BAR 1
#define LV_USE_BTN 1
#define LV_USE_LABEL 1
#if LV_USE_LABEL
    #define LV_LABEL_TEXT_SELECTION 1
    #define LV_LABEL_LONG_TXT_HINT 1
#endif
#define LV_USE_IMG 1
#define LV_USE_LINE 1
#define LV_USE_OBJ 1

/*==================
 * THEME
 *==================*/
#define LV_USE_THEME_DEFAULT 1
#if LV_USE_THEME_DEFAULT
    #define LV_THEME_DEFAULT_DARK 1
    #define LV_THEME_DEFAULT_GROW 1
    #define LV_THEME_DEFAULT_TRANSITION_TIME 80
#endif
#define LV_USE_THEME_BASIC 1
#define LV_USE_THEME_MONO 0

/*==================
 * LAYOUTS
 *==================*/
#define LV_USE_FLEX 1
#define LV_USE_GRID 1

/*==================
 * EXAMPLES / DEMOS — off, this PoC has its own bench UI in main.cpp
 *==================*/
#define LV_BUILD_EXAMPLES 0
#define LV_USE_DEMO_WIDGETS 0
#define LV_USE_DEMO_BENCHMARK 0
#define LV_USE_DEMO_STRESS 0
#define LV_USE_DEMO_MUSIC 0

#endif /* LV_CONF_H */
