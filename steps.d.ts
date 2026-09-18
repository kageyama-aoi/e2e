/// <reference types='codeceptjs' />
type steps_file = typeof import('./support/steps_file.js');
type loginKannrisyaPage = typeof import('./pages/tframe/auth/LoginKannrisyaPage.js');
type loginMyPageTeacher = typeof import('./pages/tframe/auth/LoginMyPageTeacherPage.js');
type loginMyPageStudent = typeof import('./pages/tframe/auth/LoginMyPageStudentPage.js');
type apiCommonLoginPage = typeof import('./pages/tframe/api/ApiCommonLoginPage.js');
type apiTeacherInfoGetPage = typeof import('./pages/tframe/api/ApiTeacherInfoGetPage.js');
type jsonInputPage = typeof import('./pages/tframe/api/JsonInputPage.js');
type loginPageShimamura = typeof import('./pages/shimamura/auth/LoginPage.js');
type classMemberPageShimamura = typeof import('./pages/shimamura/_common/ClassMemberPage.js');
type ichiranPageShimamura = typeof import('./pages/shimamura/screens/IchiranPage.js');
type contactRegisterPageShimamura = typeof import('./pages/shimamura/screens/ContactRegisterPage.js');
type taskReportLoginPage = typeof import('./pages/taskreport/TaskReportLoginPage.js');
type keiryoMasterPage = typeof import('./pages/tframe/screens/KeiryoMasterPage.js');
type jukuseiPage = typeof import('./pages/tframe/screens/JukuseiPage.js');
type coursePage = typeof import('./pages/tframe/screens/CoursePage.js');
type koshiPage = typeof import('./pages/tframe/screens/KoshiPage.js');
type masterMenuPage = typeof import('./pages/tframe/screens/MasterMenuPage.js');
type calendarPage = typeof import('./pages/tframe/screens/CalendarPage.js');
type emailPage = typeof import('./pages/tframe/screens/EmailPage.js');
type reportPage = typeof import('./pages/tframe/screens/ReportPage.js');
type homePage = typeof import('./pages/tframe/screens/HomePage.js');
type helpPage = typeof import('./pages/tframe/screens/HelpPage.js');
type accountPage = typeof import('./pages/tframe/screens/AccountPage.js');
type staffPage = typeof import('./pages/tframe/screens/StaffPage.js');
type shohinPage = typeof import('./pages/tframe/screens/ShohinPage.js');
type chosekinPage = typeof import('./pages/tframe/screens/ChosekinPage.js');
type classroomPage = typeof import('./pages/tframe/screens/ClassroomPage.js');
type ryokinMasterPage = typeof import('./pages/tframe/screens/RyokinMasterPage.js');
type branchPage = typeof import('./pages/tframe/screens/BranchPage.js');
type ryokinPackagePage = typeof import('./pages/tframe/screens/RyokinPackagePage.js');
type infoHistoryPage = typeof import('./pages/tframe/screens/InfoHistoryPage.js');
type keiriIchiranPage = typeof import('./pages/tframe/screens/KeiriIchiranPage.js');
type emailIchiranPage = typeof import('./pages/tframe/screens/EmailIchiranPage.js');
type emailTourokuPage = typeof import('./pages/tframe/screens/EmailTourokuPage.js');
type reportIchiranPage = typeof import('./pages/tframe/screens/ReportIchiranPage.js');

declare namespace CodeceptJS {
  interface SupportObject { I: I, current: any, login: any, loginKannrisyaPage: loginKannrisyaPage, loginMyPageTeacher: loginMyPageTeacher, loginMyPageStudent: loginMyPageStudent, apiCommonLoginPage: apiCommonLoginPage, apiTeacherInfoGetPage: apiTeacherInfoGetPage, jsonInputPage: jsonInputPage, loginPageShimamura: loginPageShimamura, classMemberPageShimamura: classMemberPageShimamura, ichiranPageShimamura: ichiranPageShimamura, contactRegisterPageShimamura: contactRegisterPageShimamura, taskReportLoginPage: taskReportLoginPage, keiryoMasterPage: keiryoMasterPage, jukuseiPage: jukuseiPage, coursePage: coursePage, koshiPage: koshiPage, masterMenuPage: masterMenuPage, calendarPage: calendarPage, emailPage: emailPage, reportPage: reportPage, homePage: homePage, helpPage: helpPage, accountPage: accountPage, staffPage: staffPage, shohinPage: shohinPage, chosekinPage: chosekinPage, classroomPage: classroomPage, ryokinMasterPage: ryokinMasterPage, branchPage: branchPage, ryokinPackagePage: ryokinPackagePage, infoHistoryPage: infoHistoryPage, keiriIchiranPage: keiriIchiranPage, emailIchiranPage: emailIchiranPage, emailTourokuPage: emailTourokuPage, reportIchiranPage: reportIchiranPage }
  interface Methods extends Playwright {}
  interface I extends ReturnType<steps_file> {}
  namespace Translation {
    interface Actions {}
  }
}
