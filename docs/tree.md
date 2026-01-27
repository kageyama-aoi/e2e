# File Tree
Last updated: 2026-01-17 06:52:29

```text
e2e/
├── data/ 
│   ├── shimamura/ 
│   │   ├── syokai_touroku_data.csv
│   │   ├── syokai_touroku_data_shimamura.testgcp.csv
│   │   ├── syokai_touroku_data_shimamura.testgcp2.csv
│   │   ├── syokai_touroku_data_shimamura.traininggcp.csv
│   │   └── taikai_testdata.csv
│   └── tframe/ 
│       └── teacherPaymentReportParams.js
├── env/ 
│   ├── .env.shimamura
│   ├── .env.shimamura.template
│   ├── .env.shimamura.testgcp
│   ├── .env.shimamura.testgcp2
│   ├── .env.shimamura.traininggcp
│   └── .env.taskreport
├── pages/ 
│   ├── shimamura/ 
│   │   ├── ClassMemberPage.js
│   │   └── LoginPage.js
│   ├── Taskreport/ 
│   │   └── TaskReportLoginPage.js
│   └── tframe/ 
│       ├── ApiCommonLoginPage.js
│       ├── ApiTeacherInfoGetPage.js
│       ├── JsonInputPage.js
│       ├── LoginKannrisyaPage.js
│       └── LoginMyPage.js
├── scripts/ 
│   └── tree_generator.py
├── support/ 
│   ├── envLoader.js
│   └── steps_file.js
├── tests/ 
│   ├── shimamura/ 
│   │   ├── shimamura_class_member_registration_test.js
│   │   ├── shimamura_login_test.js
│   │   ├── syokai_touroku_test.js
│   │   └── taikai_test.js
│   ├── smoke/ 
│   │   └── smoke_test.js
│   ├── Taskreport/ 
│   │   └── taskreport_sample_test.js
│   └── tframe/ 
│       ├── 96-60_teacher_payment_report_test.js
│       ├── get_personal_info_api_test.js
│       ├── login_test.js
│       ├── mypage_login_test.js
│       ├── navigation_after_login_student_test.js
│       ├── navigation_after_login_test.js
│       └── token_usage_test.js
├── .env
├── .gitignore
├── codecept.conf.js
├── jsconfig.json
├── jsdoc.json
├── package-lock.json
├── package.json
├── read_alluroe.html
├── README.md
├── run_syokai_shimamura.bat
└── steps.d.ts
```
