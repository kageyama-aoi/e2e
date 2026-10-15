/// <reference types='codeceptjs' />
type steps_file = typeof import('./codecept/support/steps_file.js');
type loginKannrisyaPage = typeof import('./codecept/pages/tframe/auth/LoginKannrisyaPage.js');
type loginMyPageTeacher = typeof import('./codecept/pages/tframe/auth/LoginMyPageTeacherPage.js');
type loginMyPageStudent = typeof import('./codecept/pages/tframe/auth/LoginMyPageStudentPage.js');
type apiCommonLoginPage = typeof import('./codecept/pages/tframe/api/ApiCommonLoginPage.js');
type apiTeacherInfoGetPage = typeof import('./codecept/pages/tframe/api/ApiTeacherInfoGetPage.js');
type jsonInputPage = typeof import('./codecept/pages/tframe/api/JsonInputPage.js');
type loginPageShimamura = typeof import('./codecept/pages/shimamura/auth/LoginPage.js');
type classMemberPageShimamura = typeof import('./codecept/pages/shimamura/_common/ClassMemberPage.js');
type ichiranPageShimamura = typeof import('./codecept/pages/shimamura/screens/IchiranPage.js');
type contactRegisterPageShimamura = typeof import('./codecept/pages/shimamura/screens/ContactRegisterPage.js');
type taskReportLoginPage = typeof import('./codecept/pages/taskreport/TaskReportLoginPage.js');
type keiryoMasterPage = typeof import('./codecept/pages/tframe/screens/KeiryoMasterPage.js');
type jukuseiPage = typeof import('./codecept/pages/tframe/screens/JukuseiPage.js');
type coursePage = typeof import('./codecept/pages/tframe/screens/CoursePage.js');
type koshiPage = typeof import('./codecept/pages/tframe/screens/KoshiPage.js');
type masterMenuPage = typeof import('./codecept/pages/tframe/screens/MasterMenuPage.js');
type calendarPage = typeof import('./codecept/pages/tframe/screens/CalendarPage.js');
type emailPage = typeof import('./codecept/pages/tframe/screens/EmailPage.js');
type reportPage = typeof import('./codecept/pages/tframe/screens/ReportPage.js');
type homePage = typeof import('./codecept/pages/tframe/screens/HomePage.js');
type helpPage = typeof import('./codecept/pages/tframe/screens/HelpPage.js');
type accountPage = typeof import('./codecept/pages/tframe/screens/AccountPage.js');
type staffPage = typeof import('./codecept/pages/tframe/screens/StaffPage.js');
type shohinPage = typeof import('./codecept/pages/tframe/screens/ShohinPage.js');
type chosekinPage = typeof import('./codecept/pages/tframe/screens/ChosekinPage.js');
type classroomPage = typeof import('./codecept/pages/tframe/screens/ClassroomPage.js');
type ryokinMasterPage = typeof import('./codecept/pages/tframe/screens/RyokinMasterPage.js');
type branchPage = typeof import('./codecept/pages/tframe/screens/BranchPage.js');
type ryokinPackagePage = typeof import('./codecept/pages/tframe/screens/RyokinPackagePage.js');
type infoHistoryPage = typeof import('./codecept/pages/tframe/screens/InfoHistoryPage.js');
type keiriIchiranPage = typeof import('./codecept/pages/tframe/screens/KeiriIchiranPage.js');
type emailIchiranPage = typeof import('./codecept/pages/tframe/screens/EmailIchiranPage.js');
type emailTourokuPage = typeof import('./codecept/pages/tframe/screens/EmailTourokuPage.js');
type reportIchiranPage = typeof import('./codecept/pages/tframe/screens/ReportIchiranPage.js');

declare namespace CodeceptJS {
  interface SupportObject { I: I, current: any, login: any, loginKannrisyaPage: loginKannrisyaPage, loginMyPageTeacher: loginMyPageTeacher, loginMyPageStudent: loginMyPageStudent, apiCommonLoginPage: apiCommonLoginPage, apiTeacherInfoGetPage: apiTeacherInfoGetPage, jsonInputPage: jsonInputPage, loginPageShimamura: loginPageShimamura, classMemberPageShimamura: classMemberPageShimamura, ichiranPageShimamura: ichiranPageShimamura, contactRegisterPageShimamura: contactRegisterPageShimamura, taskReportLoginPage: taskReportLoginPage, keiryoMasterPage: keiryoMasterPage, jukuseiPage: jukuseiPage, coursePage: coursePage, koshiPage: koshiPage, masterMenuPage: masterMenuPage, calendarPage: calendarPage, emailPage: emailPage, reportPage: reportPage, homePage: homePage, helpPage: helpPage, accountPage: accountPage, staffPage: staffPage, shohinPage: shohinPage, chosekinPage: chosekinPage, classroomPage: classroomPage, ryokinMasterPage: ryokinMasterPage, branchPage: branchPage, ryokinPackagePage: ryokinPackagePage, infoHistoryPage: infoHistoryPage, keiriIchiranPage: keiriIchiranPage, emailIchiranPage: emailIchiranPage, emailTourokuPage: emailTourokuPage, reportIchiranPage: reportIchiranPage }
  interface Methods extends Playwright {}
  interface I extends ReturnType<steps_file> {}
  namespace Translation {
    interface Actions {}
  }
}
