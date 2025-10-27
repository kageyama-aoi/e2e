module.exports = (token, year, month, headerPattern = '001') => ({
  api: 'displayTeacherPaymentReport',
  tcnToken: token,
  targetYear: year,
  targetMonth: month,
  headerPattern: headerPattern,
});
