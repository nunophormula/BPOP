import axios from "axios";
import config from "./config";

const helpers = {
  updateEoehssScore: (form) => {
    const values = form.getFieldValue("EOEHSS");
    let auxGradeScore = 0;
    let auxStageScore = 0;
    let gradeQtd = 0;
    let stageQtd = 0;
    let gradeResult = 0;
    let stageResult = 0;

    if (values) {
      for (var i = 1; i <= values.length; i++) {
        if (values[i - 1].TYPE === "Grade" && values[i - 1].VALUE !== "NONE" && values[i - 1].VALUE !== null) {
          let value = parseInt(values[i - 1].VALUE);
          if (!isNaN(value)) {
            auxGradeScore += value;
            gradeQtd = gradeQtd + 3;
          }
        } else if (values[i - 1].TYPE === "Stage" && values[i - 1].VALUE !== "NONE" && values[i - 1].VALUE !== null) {
          let value = parseInt(values[i - 1].VALUE);
          if (!isNaN(value)) {
            auxStageScore += value;
            stageQtd = stageQtd + 3;
          }
        }
      }
    }

    if (gradeQtd > 0) {
      console.log(auxGradeScore / gradeQtd);
      gradeResult = parseFloat(auxGradeScore / gradeQtd).toFixed(2);
    }

    if (stageQtd > 0) {
      stageResult = parseFloat(auxStageScore / stageQtd).toFixed(2);
    }

    return (
      <>
        <div className="flex items-center">
          <p className="text-center text-white text-[16px]">Grade Score: {gradeResult}</p>
        </div>
        <div className="flex items-center">
          <p className="text-center text-white text-[16px]">Stage Score: {stageResult}</p>
        </div>
      </>
    );
  },

  clearEoehss: (form, i) => {
    const values = form.getFieldValue("EOEHSS");
    values[i].VALUE = null;
    form.setFieldValue("EOEHSS", values);
    this.updatePeessScore(form);
  },

  updatePeessScore: (form) => {
    const values = form.getFieldValue("PEESS");
    let auxFrequencyScore = 0,
      frequencyN = 0,
      auxSeverityScore = 0,
      severityN = 0,
      auxTotalScore = 0,
      auxScore = 0,
      totalN = 0;
    if (values) {
      for (let i = 1; i <= 20; i++) {
        if (values[i - 1].VALUE !== null && values[i - 1].VALUE >= 0) {
          let value = values[i - 1].VALUE !== null ? parseInt(values[i - 1].VALUE) : "";
          // Severity
          if (values[i - 1].TYPE === "Severity") {
            if (!isNaN(value)) {
              severityN++;
              auxSeverityScore += value;

              totalN++;
              auxScore += value;
            }
          } else {
            if (!isNaN(value)) {
              frequencyN++;
              auxFrequencyScore += value;

              totalN++;
              auxScore += value;
            }
          }
        }
      }
    }

    if (frequencyN !== 0) {
      auxFrequencyScore = (auxFrequencyScore / frequencyN).toFixed(2);
    }

    if (severityN !== 0) {
      console.log(auxSeverityScore);
      auxSeverityScore = (auxSeverityScore / severityN).toFixed(2);
    }

    if (totalN >= 10) {
      auxTotalScore = (auxScore / 20).toFixed(2);
    }

    return (
      <>
        <p className="text-center text-white text-[16px]">Frequency Score: {auxFrequencyScore} </p>
        <p className="text-center text-white text-[16px]">Severity Score: {auxSeverityScore}</p>
        <p className="text-center text-white text-[16px]">Total Score: {auxTotalScore}</p>
        <p className="text-center text-[10px] text-white mt-4">*Total score will not be calculated if more than 50% of the items are missing.</p>
      </>
    );
  },

  clearPeess: (form, i) => {
    const values = form.getFieldValue("PEESS");
    values[i].VALUE = null;
    form.setFieldValue("PEESS", values);
    this.updatePeessScore(form);
  },

  updateErefsScore: (form) => {
    const values = form.getFieldValue("EREFS");
    let auxInflamScore = 0;
    let auxFibrostenoticScore = 0;
    let auxTotalScore = 0;

    for (let i = 1; i <= 5; i++) {
      let value = parseInt(values[i - 1].VALUE);
      if (!isNaN(value) && value !== "NONE" && !(i === 1 && value === 2)) {
        if (i === 1 || i === 3 || i === 5) {
          auxInflamScore += value;
          auxTotalScore += value;
        } else {
          auxFibrostenoticScore += value;
          auxTotalScore += value;
        }
      }

      if (value > 0) {
        form.setFieldValue("EREFS_NORMAL", null);
      }
    }

    return (
      <>
        <p className="text-white text-center text-[16px]">Inflammatory Score: {auxInflamScore}</p>
        <p className="text-white text-center text-[16px]">Fibrostenotic Score: {auxFibrostenoticScore}</p>
        <p className="text-white text-center font-bold text-[16px]"> Total Score: {auxTotalScore}</p>
      </>
    );
  },

  clearErefs: (form, i) => {
    const values = form.getFieldValue("EREFS");
    values[i].VALUE = null;
    form.setFieldValue("EREFS", values);
    this.updateErefsScore();
  },

  normalErefs: (form, e) => {
    const values = form.getFieldValue("EREFS");
    for (let i = 0; i < values.length; i++) values[i].VALUE = e ? 0 : null;
    form.setFieldValue("EREFS", values);
  },

  generateYears: (startYear, endYear) => {
    const years = [];
    let currentYear = startYear;
    while (currentYear <= endYear) {
      years.push(currentYear);
      currentYear++;
    }
    return years;
  },
};

export default helpers;
