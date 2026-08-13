import scopeImg0 from "../assets/scope/0.png";
import scopeImg1_1 from "../assets/scope/1-1.png";
import scopeImg1_2 from "../assets/scope/1-2.png";
import scopeImg1_3 from "../assets/scope/1-3.png";
import scopeImg1_4 from "../assets/scope/1-4.png";
import scopeImg1_5 from "../assets/scope/1-5.png";
import scopeImg2_2 from "../assets/scope/2-2.png";
import scopeImg2_3 from "../assets/scope/2-3.png";
import scopeImg2_4 from "../assets/scope/2-4.png";
import scopeImg3 from "../assets/scope/3.png";

const initialValues = {
  PHX_ATOPY: [
    { EOE: 1, LABEL: "EoE" },
    { ASTHMA_PATIENT: 0, LABEL: "Asthma" },
    { ECZEMA_PATIENT: 0, LABEL: "Eczema" },
    { RHINITIS_PATIENT: 0, LABEL: "Rhinitis" },
    { FOOD_ALLERGY_PATIENT: 0, LABEL: "Food Allergy" },
    { NO_ATOPY_PATIENT: 0, LABEL: "No Atopy" },
    { UNKNOWN_PATIENT: 0, LABEL: "Unknown" },
    { OTHER_PATIENT: 0, LABEL: "" },
  ],
  DAILY_DOSE: [
    {
      PPI: 0,
      LABEL: "PPI",
      KEY: "PPI",
      TYPE: "select",
      OPTIONS: [
        { value: 1, label: "Omeprazole" },
        { value: 2, label: "Esomeprazole" },
        { value: 3, label: "Lansoprazole" },
        { value: 4, label: "Rabeprazole" },
        { value: 9, label: "Other" },
      ],
    },
    {
      TOPICAL_STEROIDS: 0,
      LABEL: "Topical Steroids",
      KEY: "TOPICAL_STEROIDS",
      TYPE: "select",
      OPTIONS: [
        { value: 1, label: "Viscous budesonide gel" },
        { value: 2, label: "Fluticasone inhaler" },
        { value: 3, label: "Jorveza" },
        { value: 9, label: "Other" },
      ],
    },
    {
      ORAL_STEROIDS: 0,
      LABEL: "Systemic Steroids",
      KEY: "ORAL_STEROIDS",
      TYPE: "select",
      OPTIONS: [
        { value: 1, label: "Prednisone" },
        { value: 2, label: "Prednisolone" },
        { value: 3, label: "Methylprednisolone" },
      ],
    },
    {
      DIET: 0,
      LABEL: "Diet",
      KEY: "DIET",
      TYPE: "table",
      children: [
        { TYPE: "none", LABEL: "Milk", KEY: "MILK" },
        { TYPE: "none", LABEL: "Eggs", KEY: "EGGS" },
        {
          TYPE: "select",
          OPTIONS: [
            { value: 1, label: "Wheat" },
            { value: 2, label: "Gluten" },
          ],
          KEY: "WHEAT",
        },
        { TYPE: "none", LABEL: "Fish / shellfish", KEY: "FISH" },
        { TYPE: "none", LABEL: "Soy", KEY: "SOY" },
        { TYPE: "none", LABEL: "Peanuts", KEY: "PEANUTS" },
        { TYPE: "none", LABEL: "Elemental diet", KEY: "ELEMENTAL" },
      ],
    },
    { DILATION: 0, LABEL: "Dilation", KEY: "DILATION", TYPE: "radio" },
    { OTHER_MEDICATION: 0, LABEL: "Other medication", KEY: "OTHER_MEDICATION", TYPE: "text" },
  ],
  DAILY_DOSE2: [
    {
      PPI: 0,
      LABEL: "PPI",
      KEY: "PPI",
      TYPE: "select",
      OPTIONS: [
        { value: 1, label: "Omeprazole" },
        { value: 2, label: "Esomeprazole" },
        { value: 3, label: "Lansoprazole" },
        { value: 4, label: "Rabeprazole" },
        { value: 9, label: "Other" },
      ],
    },
    {
      TOPICAL_STEROIDS: 0,
      LABEL: "Topical Steroids",
      KEY: "TOPICAL_STEROIDS",
      TYPE: "select",
      OPTIONS: [
        { value: 1, label: "Viscous budesonide gel" },
        { value: 2, label: "Fluticasone inhaler" },
        { value: 3, label: "Jorveza" },
        { value: 9, label: "Other" },
      ],
    },
    {
      ORAL_STEROIDS: 0,
      LABEL: "Systemic Steroids",
      KEY: "ORAL_STEROIDS",
      TYPE: "select",
      OPTIONS: [
        { value: 1, label: "Prednisone" },
        { value: 2, label: "Prednisolone" },
        { value: 3, label: "Methylprednisolone" },
      ],
    },
    {
      CHECKED: 0,
      DIET: [
        { TYPE: "none", LABEL: "Milk", KEY: "MILK" },
        { TYPE: "none", LABEL: "Eggs", KEY: "EGGS" },
        {
          TYPE: "select",
          OPTIONS: [
            { value: 1, label: "Wheat" },
            { value: 2, label: "Gluten" },
          ],
          KEY: "WHEAT",
        },
        { TYPE: "none", LABEL: "Fish / shellfish", KEY: "FISH" },
        { TYPE: "none", LABEL: "Soy", KEY: "SOY" },
        { TYPE: "none", LABEL: "Peanuts", KEY: "PEANUTS" },
        { TYPE: "none", LABEL: "Elemental diet", KEY: "ELEMENTAL" },
      ],
      LABEL: "Diet",
      KEY: "DIET",
      TYPE: "table",
    },
    { DILATION: 0, LABEL: "Dilation", KEY: "DILATION", TYPE: "radio" },
    { OTHER_MEDICATION: 0, LABEL: "Other medication", KEY: "OTHER_MEDICATION", TYPE: "text" },
  ],
  DAILY_DOSE3: [
    {
      PPI: 0,
      LABEL: "PPI",
      KEY: "PPI",
      TYPE: "select",
      OPTIONS: [
        { value: 1, label: "Omeprazole" },
        { value: 2, label: "Esomeprazole" },
        { value: 3, label: "Lansoprazole" },
        { value: 4, label: "Rabeprazole" },
        { value: 9, label: "Other" },
      ],
    },
    {
      TOPICAL_STEROIDS: 0,
      LABEL: "Topical Steroids",
      KEY: "TOPICAL_STEROIDS",
      TYPE: "select",
      OPTIONS: [
        { value: 1, label: "Viscous budesonide gel" },
        { value: 2, label: "Fluticasone inhaler" },
        { value: 3, label: "Jorveza" },
        { value: 9, label: "Other" },
      ],
    },
    {
      ORAL_STEROIDS: 0,
      LABEL: "Systemic Steroids",
      KEY: "ORAL_STEROIDS",
      TYPE: "select",
      OPTIONS: [
        { value: 1, label: "Prednisone" },
        { value: 2, label: "Prednisolone" },
        { value: 3, label: "Methylprednisolone" },
      ],
    },
    {
      CHECKED: 0,
      DIET: [
        { TYPE: "none", LABEL: "Milk", KEY: "MILK" },
        { TYPE: "none", LABEL: "Eggs", KEY: "EGGS" },
        {
          TYPE: "select",
          OPTIONS: [
            { value: 1, label: "Wheat" },
            { value: 2, label: "Gluten" },
          ],
          KEY: "WHEAT",
        },
        { TYPE: "none", LABEL: "Fish / shellfish", KEY: "FISH" },
        { TYPE: "none", LABEL: "Soy", KEY: "SOY" },
        { TYPE: "none", LABEL: "Peanuts", KEY: "PEANUTS" },
        { TYPE: "none", LABEL: "Elemental diet", KEY: "ELEMENTAL" },
      ],
      LABEL: "Diet",
      KEY: "DIET",
      TYPE: "table",
    },
    { DILATION: 0, LABEL: "Dilation", KEY: "DILATION", TYPE: "radio" },
    { OTHER_MEDICATION: 0, LABEL: "Other medication", KEY: "OTHER_MEDICATION", TYPE: "text" },
  ],
  DIAGNOSIS: [
    { VALUE: 0, LABEL: "EoE", AVAILABLE_TXT: false },
    { VALUE: 0, LABEL: "Eosinophilic Gastritis", AVAILABLE_TXT: false },
    { VALUE: 0, LABEL: "Eosinophilic Enteritis", AVAILABLE_TXT: false },
    { VALUE: 0, LABEL: "Other", AVAILABLE_TXT: true, TXT: null },
    { VALUE: 0, LABEL: "PPI reponsive", AVAILABLE_TXT: false },
    { VALUE: 0, LABEL: "PPI resistant", AVAILABLE_TXT: false },
    { VALUE: 0, LABEL: "Steroid responsive", AVAILABLE_TXT: false },
    { VALUE: 0, LABEL: "Steroid Dependent", AVAILABLE_TXT: false },
    { VALUE: 0, LABEL: "Steroid resistant", AVAILABLE_TXT: false },
    { VALUE: 0, LABEL: "1 FED (food elimination diet) responsive", AVAILABLE_TXT: true, TXT: null },
    { VALUE: 0, LABEL: "2-FED responsive", AVAILABLE_TXT: true, TXT: null },
    { VALUE: 0, LABEL: "3-FED responsive", AVAILABLE_TXT: true, TXT: null },
    { VALUE: 0, LABEL: "4-FED responsive", AVAILABLE_TXT: true, TXT: null },
    { VALUE: 0, LABEL: "Elemental formula responsive", AVAILABLE_TXT: false },
    { VALUE: 0, LABEL: "Stricturing disease", AVAILABLE_TXT: false },
  ],
  EREFS: [
    {
      VALUE: null,
      LABEL: "<b>Edema</b> (loss vascular markings)<br/>Grade 0: Distinct vascular<br/>Grade 1: Decreased<br/>Grade 2: Absent",
      OPTIONS: [
        {
          VALUE: 0,
          LABEL: <img src={scopeImg0} className="max-h-[100px]" />,
        },
        {
          VALUE: 1,
          LABEL: <img src={scopeImg1_1} className="max-h-[100px]" />,
        },
        {
          VALUE: 2,
          LABEL: <p>Absent</p>,
          TYPE: "text",
        },
      ],
    },
    {
      VALUE: null,
      LABEL: "<b>Rings</b> (trachealization)<br/>Grade 0: None<br/>Grade 1: Mild (ridges)<br/>Grade 2: Moderate (distinct rings)<br/>Grade 3: Severe (not pass scope)",
      OPTIONS: [
        {
          VALUE: 0,
          LABEL: <img src={scopeImg0} className="max-h-[100px]" />,
        },
        {
          VALUE: 1,
          LABEL: <img src={scopeImg1_2} className="max-h-[100px]" />,
        },
        {
          VALUE: 2,
          LABEL: <img src={scopeImg2_2} className="max-h-[100px]" />,
        },
        {
          VALUE: 3,
          LABEL: <img src={scopeImg3} className="max-h-[100px]" />,
        },
      ],
    },
    {
      VALUE: null,
      LABEL: "<b>Exudate</b> (white plaques)<br/>Grade 0: None<br/>Grade 1: Mild (&lt;10 % surface area)<br/>Grade 2: Severe (&gt;10 % surface area)",
      OPTIONS: [
        {
          VALUE: 0,
          LABEL: <img src={scopeImg0} className="max-h-[100px]" />,
        },
        {
          VALUE: 1,
          LABEL: <img src={scopeImg1_3} className="max-h-[100px]" />,
        },
        {
          VALUE: 2,
          LABEL: <img src={scopeImg2_3} className="max-h-[100px]" />,
        },
      ],
    },
    {
      VALUE: null,
      LABEL: "<b>Furrows</b> (vertical lines)<br/>Grade 0: None<br/>Grade 1: Mild<br/>Grade 2: Severe (deph)",
      OPTIONS: [
        {
          VALUE: 0,
          LABEL: <img src={scopeImg0} className="max-h-[100px]" />,
        },
        {
          VALUE: 1,
          LABEL: <img src={scopeImg1_4} className="max-h-[100px]" />,
        },
        {
          VALUE: 2,
          LABEL: <img src={scopeImg2_4} className="max-h-[100px]" />,
        },
      ],
    },
    {
      VALUE: null,
      LABEL: "<b>Stricture</b> (vertical lines)<br/>Grade 0: Absent<br/>Grade 1: Present",
      OPTIONS: [
        {
          VALUE: 0,
          LABEL: <img src={scopeImg0} className="max-h-[100px]" />,
        },
        {
          VALUE: 1,
          LABEL: <img src={scopeImg1_5} className="max-h-[100px]" />,
        },
      ],
    },
  ],
  PEESS: [
    { VALUE: null, LABEL: "1. How often do you have chest pain, ache, or hurt?", TYPE: "Frequency" },
    { VALUE: null, LABEL: "2. How bad is the chest pain, ache, or hurt?", TYPE: "Severity" },
    { VALUE: null, LABEL: "3. How often do you have heartburn (burning in your chest, mouth, or throat)?", TYPE: "Frequency" },
    { VALUE: null, LABEL: "4. How bad is your heartburn (burning in your chest, mouth, or throat)?", TYPE: "Severity" },
    { VALUE: null, LABEL: "5. How often do you have stomach aches or belly aches?", TYPE: "Frequency" },
    { VALUE: null, LABEL: "6. How bad are the stomach aches or belly aches?", TYPE: "Severity" },
    { VALUE: null, LABEL: "7. How often do you have trouble swallowing?", TYPE: "Frequency" },
    { VALUE: null, LABEL: "8. How bad is the trouble swallowing?", TYPE: "Severity" },
    { VALUE: null, LABEL: "9. How often do you feel like food gets stuck in your throat or chest?", TYPE: "Frequency" },
    { VALUE: null, LABEL: "10. How bad is it when food gets stuck in your throat or chest?", TYPE: "Severity" },
    { VALUE: null, LABEL: "11. How often do you need to drink a lot to help swallow your food?", TYPE: "Frequency" },
    { VALUE: null, LABEL: "12. How bad is it if you don't drink a lot to help swallow your food?", TYPE: "Severity" },
    { VALUE: null, LABEL: "13. How often do you vomit (throw up)?", TYPE: "Frequency" },
    { VALUE: null, LABEL: "14. How bad is the vomiting (throwing up)?", TYPE: "Severity" },
    { VALUE: null, LABEL: "15. How often do you feel nauseous (feel like you're going to throw up, but don't)?", TYPE: "Frequency" },
    { VALUE: null, LABEL: "16. How bad is the nausea (feeling like you're going to throw up, but don't)?", TYPE: "Severity" },
    { VALUE: null, LABEL: "17. How often does food come back up your throat when eating?", TYPE: "Frequency" },
    { VALUE: null, LABEL: "18. How bad is the food coming back up your throat when eating?", TYPE: "Severity" },
    { VALUE: null, LABEL: "19. How often do you eat less food than others?", TYPE: "Frequency" },
    { VALUE: null, LABEL: "20. How often do you need more time to eat than others?", TYPE: "Frequency" },
  ],
  EOEHSS: [
    {
      VALUE: null,
      LABEL: "Basal layer hyperplasia % total epithelial height",
      TYPE: "Grade",
      OPTIONS: [
        { VALUE: 0, LABEL: "None" },
        { VALUE: 1, LABEL: "< 33%" },
        { VALUE: 2, LABEL: "33 - 66%" },
        { VALUE: 3, LABEL: "> 66%" },
        { VALUE: "NONE", LABEL: "Can't access" },
      ],
    },
    {
      VALUE: null,
      LABEL: "Basal layer hyperplasia",
      TYPE: "Stage",
      OPTIONS: [
        { VALUE: 0, LABEL: "None" },
        { VALUE: 1, LABEL: "< 33% epithelium" },
        { VALUE: 2, LABEL: "33 - 66%" },
        { VALUE: 3, LABEL: "> 66%" },
        { VALUE: "NONE", LABEL: "Can't access" },
      ],
    },
    {
      VALUE: null,
      LABEL: "Eosinophil # (peak)",
      TYPE: "Grade",
      OPTIONS: [
        { VALUE: 0, LABEL: "None" },
        { VALUE: 1, LABEL: "< 15" },
        { VALUE: 2, LABEL: "15 - 59" },
        { VALUE: 3, LABEL: "> 60" },
      ],
    },
    {
      VALUE: null,
      LABEL: "Eosinophil # ≥15/hpf",
      TYPE: "Stage",
      OPTIONS: [
        { VALUE: 0, LABEL: "None" },
        { VALUE: 1, LABEL: "< 33% hpfs" },
        { VALUE: 2, LABEL: "33 - 66%" },
        { VALUE: 3, LABEL: "> 66%" },
      ],
    },
    {
      VALUE: null,
      LABEL: "Abscesses # eos/abscess",
      TYPE: "Grade",
      OPTIONS: [
        { VALUE: 0, LABEL: "None" },
        { VALUE: 1, LABEL: "4 - 9" },
        { VALUE: 2, LABEL: "10 - 20" },
        { VALUE: 3, LABEL: "> 20" },
      ],
    },
    {
      VALUE: null,
      LABEL: "Abscesses",
      TYPE: "Stage",
      OPTIONS: [
        { VALUE: 0, LABEL: "None" },
        { VALUE: 1, LABEL: "< 33% hpfs" },
        { VALUE: 2, LABEL: "33 - 66%" },
        { VALUE: 3, LABEL: "> 66%" },
      ],
    },
    {
      VALUE: null,
      LABEL: "Surface layering # eos/focus",
      TYPE: "Grade",
      OPTIONS: [
        { VALUE: 0, LABEL: "None" },
        { VALUE: 1, LABEL: "<= 9" },
        { VALUE: 2, LABEL: "5 - 10" },
        { VALUE: 3, LABEL: "> 10" },
        { VALUE: "NONE", LABEL: "Can't access" },
      ],
    },
    {
      VALUE: null,
      LABEL: "Surface layering",
      TYPE: "Stage",
      OPTIONS: [
        { VALUE: 0, LABEL: "None" },
        { VALUE: 1, LABEL: "< 33% hpfs" },
        { VALUE: 2, LABEL: "33 - 66%" },
        { VALUE: 3, LABEL: "> 66%" },
        { VALUE: "NONE", LABEL: "Can't access" },
      ],
    },
    {
      VALUE: null,
      LABEL: "DIS mag required to see bridges",
      TYPE: "Grade",
      OPTIONS: [
        { VALUE: 0, LABEL: "None" },
        { VALUE: 1, LABEL: "400X" },
        { VALUE: 2, LABEL: "200X" },
        { VALUE: 3, LABEL: "100X" },
      ],
    },
    {
      VALUE: null,
      LABEL: "DIS",
      TYPE: "Stage",
      OPTIONS: [
        { VALUE: 0, LABEL: "None" },
        { VALUE: 1, LABEL: "< 33% hpfs" },
        { VALUE: 2, LABEL: "33 - 66%" },
        { VALUE: 3, LABEL: "> 66%" },
      ],
    },
    {
      VALUE: null,
      LABEL: "Surface alteration",
      TYPE: "Grade",
      OPTIONS: [
        { VALUE: 0, LABEL: "None" },
        { VALUE: 1, LABEL: "0 eos" },
        { VALUE: 2, LABEL: "Any eos" },
        { VALUE: 3, LABEL: "Exudate" },
        { VALUE: "NONE", LABEL: "Can't access" },
      ],
    },
    {
      VALUE: null,
      LABEL: "Surface alteration",
      TYPE: "Stage",
      OPTIONS: [
        { VALUE: 0, LABEL: "None" },
        { VALUE: 1, LABEL: "< 33% hpfs" },
        { VALUE: 2, LABEL: "33 - 66%" },
        { VALUE: 3, LABEL: "> 66%" },
        { VALUE: "NONE", LABEL: "Can't access" },
      ],
    },
    {
      VALUE: null,
      LABEL: "Dyskeratotic epithelial cells",
      TYPE: "Grade",
      OPTIONS: [
        { VALUE: 0, LABEL: "None" },
        { VALUE: 1, LABEL: "1" },
        { VALUE: 2, LABEL: "2 - 5" },
        { VALUE: 3, LABEL: "> 5" },
      ],
    },
    {
      VALUE: null,
      LABEL: "Surface alteration",
      TYPE: "Stage",
      OPTIONS: [
        { VALUE: 0, LABEL: "None" },
        { VALUE: 1, LABEL: "< 33% hpfs" },
        { VALUE: 2, LABEL: "33 - 66%" },
        { VALUE: 3, LABEL: "> 66%" },
      ],
    },
    {
      VALUE: null,
      LABEL: "Lamina propria fibrosis",
      TYPE: "Grade",
      OPTIONS: [
        { VALUE: 0, LABEL: "None" },
        { VALUE: 1, LABEL: "Mild" },
        { VALUE: 2, LABEL: "Moderate" },
        { VALUE: 3, LABEL: "Marked" },
        { VALUE: "NONE", LABEL: "Can't access" },
      ],
    },
    {
      VALUE: null,
      LABEL: "Lamina propria fibrosis",
      TYPE: "Stage",
      OPTIONS: [
        { VALUE: 0, LABEL: "None" },
        { VALUE: 1, LABEL: "< 33%" },
        { VALUE: 2, LABEL: "33 - 66%" },
        { VALUE: 3, LABEL: "> 66%" },
        { VALUE: "NONE", LABEL: "Can't access" },
      ],
    },
  ],
  BARIUM_SWALLOWS: [{ NORMAL: null, DISTAL: null, NARROW: null, HIATAL: null, UPPER: null, FREE: null, MIDDLE: null, OTHER: null, OTHER_TXT: null, DATE: null }],
  INVESTIGATION: {
    EXTRA: [
      {
        ACTH_DATE: null,
        ACTH_OPTION: null,
        ACTH_MICROGRAMS: null,
        ACTH_MICROGRAMS_TXT: null,
        TIME: null,
        TIME_30: null,
        TIME_60: null,
        UNITS: null,
        UNITS_TXT: null,
        DEXA_DATE: null,
        DEXA_ZSCORE: null,
        DEXA_OPTION: null,
        VITAMIND_DATE: null,
        VITAMIND_UNITS: null,
        VITAMIND_OPTION: null,
        VITAMIND_OPTION_TXT: null,
      },
    ],
    BARIUM_SWALLOWS: [],
  },
};

export default initialValues;
