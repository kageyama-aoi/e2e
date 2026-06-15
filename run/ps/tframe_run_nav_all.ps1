param(
    [string]$Profile = "tframe.juku_admin"
)

$tests = @(
    "page/jukusei_test.js"
    "page/course_test.js"
    "page/koshi_test.js"
    "page/master_menu_test.js"
    "page/calendar_test.js"
    "page/email_test.js"
    "page/report_test.js"
    "page/home_test.js"
    "page/help_test.js"
)

& "$PSScriptRoot\_run_batch_core.ps1" -Product "tframe" -Profile $Profile -Tests $tests
