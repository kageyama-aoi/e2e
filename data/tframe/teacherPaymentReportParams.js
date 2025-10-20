module.exports = (token, year, month, headderPattern = '001') => ({
  api: 'displayTeacherPaymentReport',
  tcnToken: token,
  targetYear: year,
  targetMonth: month,
  headderPattern: headderPattern,
});
