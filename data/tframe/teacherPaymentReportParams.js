module.exports = (token, year, month) => ({
  api: 'displayTeacherPaymentReport',
  tcnToken: token,
  targetYear: year,
  targetMonth: month,
  headderPattern: '001',
});
