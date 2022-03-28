const express = require('express');
const moment = require('moment');
const knex = require('../dbconnection');
const { checkAuthenticated, checkNotAuthenticated } = require('../middlewares/auth');

const router = express.Router();

function uniqueId(appIdColumn) {
  const arrayOfIds = appIdColumn.map((app) => app.application_id);
  if (appIdColumn != 0) {
    return Math.max(...arrayOfIds) + 1;
  }
  return 1;
}

router.get('/careers/job/:job_id/resume', async (req, res) => {
  const jobId = req.params.job_id;
  const applicantDetails = await knex('job_application.applicant_details');
  const unique = uniqueId(applicantDetails);
  const jobs = await knex('jobs.job_opening').where('job_id', jobId);
  const skill = await knex('admin.skill')
    .innerJoin('jobs.skill', 'jobs.skill.skill_id', 'admin.skill.skill_id')
    .where('job_id', jobId);

  res.render('resume', { jobId, jobs, skill, unique });
});

router.post('/careers/job/:job_id/resume', async (req, res) => {
  const jobId = req.params.job_id;
  const {
    appId,
    first_name,
    middle_name,
    last_name,
    gender,
    date_of_birth,
    email,
    skype,
    mobile,
    preferred_contact,
    address,
    city,
    province,
    expected_salary,
    start_date,
    preferred_interview_date_1,
    preferred_interview_date_2,
    preferred_interview_date_3,
    skill_id,
    skill_years,
    skill_self_rating,
    capability_1,
    capability_2,
    capability_3,
    capability_4,
    capability_5,
    year_experience,
    history_start_date,
    history_end_date,
    position,
    company,
    school,
    course,
    date_graduated,
  } = req.body;
  
  const link = `http://localhost:3000/careers/job/${jobId}/resume/application/${appId}`
  const startDate = moment(history_start_date, 'MM/DD/YYYY');
  const endDate = moment(history_end_date, 'MM/DD/YYYY');

  let yearDiff = endDate.diff(startDate, 'years');

  if (isNaN(yearDiff)) {
    yearDiff = 0;
  }
  const totalYears = yearDiff;

  const today = new Date();
  const thisDay = moment(today, 'MM/DD/YYYY');
  knex('job_application.applicant_details')
    .insert({
      job_id: jobId,
      application_id: appId,
      first_name,
      middle_name,
      last_name,
      gender,
      date_of_birth,
      email,
      skype,
      mobile,
      preferred_contact,
      address,
      city,
      province,
      expected_salary,
      start_date,
      preferred_interview_date_1,
      preferred_interview_date_2,
      preferred_interview_date_3,
      application_link: link,
      year_experience: totalYears,
      date_applied: thisDay,
      date_last_updated: thisDay,
    })
    .then(() => {
      knex('job_application.capabilities')
        .insert({
          application_id: appId,
          capability_1,
          capability_2,
          capability_3,
          capability_4,
          capability_5,
        })
        .then(async () => {
          for (let i = 0; i < history_start_date.length; i++) {
            if (history_start_date[i] == '' && history_end_date[i] == '') {
              history_start_date[i] = null;
              history_end_date[i] = null;
            } else {
              history_start_date[i] = moment(history_start_date[i]).format('L');
              history_end_date[i] = moment(history_end_date[i]).format('L');
            }
            knex('job_application.employment_history')
              .insert({
                application_id: appId,
                history_start_date: history_start_date[i],
                history_end_date: history_end_date[i],
                position: position[i],
                company: company[i],
              })
              .then((results) => results);
          }

          for (let i = 0; i < date_graduated.length; i++) {
            if (date_graduated[i] == '') {
              date_graduated[i] = null;
            } else {
              date_graduated[i] = moment(date_graduated[i]).format('L');
            }
            knex("job_application.education")
                .insert({
                  application_id: appId,
                  school: school[i],
                  course: course[i],
                  date_graduated: date_graduated[i],
                })
                .then(result => result)
          }
          // .then(async () => {
          const skill = await knex('jobs.skill').where('job_id', jobId);
          if (skill != 0) {
            for (let i = 0; i < skill_id.length; i++) {
              if (skill_years[i] == '' && skill_self_rating[i] == '') {
                skill_years[i] = 0;
                skill_self_rating[i] = 0;
                knex('job_application.applicant_rating')
                  .insert({
                    application_id: appId,
                    skill_id: skill_id[i],
                    skill_years: skill_years[i],
                    skill_self_rating: skill_self_rating[i],
                  })
                  .then((result) => result);
              }
            }
          }
          res.redirect(`/careers/job/${jobId}/resume/application/${appId}`);
          // });
        });
    });
});
module.exports = router;