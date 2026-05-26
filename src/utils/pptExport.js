import PptxGenJS from 'pptxgenjs';

// Theme Constants matching DigiChefs template
const THEME = {
  orange: 'EA580C',
  bg: 'FFFFFF', // Can use off-white FFFCF9 if preferred
  textDark: '1A1A2E',
  textMuted: '6B7280',
  fontFamily: 'Montserrat', // or Arial as fallback
  borderColor: 'F97316', // Lighter orange for table borders
};

export async function generatePPT(brandMetrics, analysisData, clientName = 'Brand') {
  const pptx = new PptxGenJS();
  
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'DigiChefs AI Audit Bot';
  pptx.company = 'DigiChefs';
  pptx.title = `${clientName} - Competitor Audit`;

  // Master slide with watermark/design elements could go here
  pptx.defineSlideMaster({
    title: 'MASTER_SLIDE',
    background: { color: THEME.bg },
    margin: [0.5, 0.5, 0.5, 0.5]
  });

  // Extract all brands
  const allBrands = brandMetrics.map(b => b.name);
  const brandCount = allBrands.length;

  // Common Table Options
  const masterTableOpts = {
    x: 0.5, y: 1.5, w: 9.0,
    border: { pt: 1, color: THEME.borderColor },
    color: THEME.textDark,
    valign: 'middle',
    align: 'center',
    fontFace: THEME.fontFamily,
    fontSize: 12
  };

  const headerRowOpts = {
    bold: true,
    color: THEME.textDark,
    fill: { color: 'FFFFFF' }, // Assuming white headers with orange borders
    fontSize: 14
  };

  const platformColOpts = {
    bold: true,
    fill: { color: 'FFFFFF' },
  };

  // Helper to format numbers
  const fmtStr = (val) => val === undefined || val === null ? '-' : val.toLocaleString();
  const fmtRate = (val) => val === undefined || val === null ? '-' : `${val}%`;

  // ---------------------------------------------------------
  // SLIDE 1: Key Comparison (Instagram & LinkedIn)
  // ---------------------------------------------------------
  let slide1 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  slide1.addText('Key Comparison', { x: 0.5, y: 0.5, w: 5, fontSize: 28, bold: true, color: THEME.orange });

  // Build Table Data for Slide 1
  let table1 = [];
  
  // Header Row
  let headerRow1 = [
    { text: '', options: { border: { type: 'none' } } },
    { text: 'Key Parameters', options: { ...headerRowOpts, w: 2 } },
    ...allBrands.map(name => ({ text: name, options: { ...headerRowOpts, w: 6 / brandCount } }))
  ];
  table1.push(headerRow1);

  // Instagram Data (5 rows)
  const igRows = [
    { label: 'Total Followers', key: 'followers', fmt: fmtStr },
    { label: 'Engagement Rate (%)', key: 'engagementRate', fmt: fmtRate },
    { label: 'Average Likes', key: 'avgLikes', fmt: fmtStr },
    { label: 'Average Comments', key: 'avgComments', fmt: fmtStr },
    { label: 'Frequency (3 Months)', key: 'postingFrequency', fmt: val => val ? `${val}/wk` : '-' }
  ];

  igRows.forEach((rowDef, i) => {
    let row = [];
    if (i === 0) {
      row.push({ text: 'Instagram', options: { ...platformColOpts, rowSpan: 5 } });
    }
    row.push({ text: rowDef.label, options: { align: 'center' } });
    allBrands.forEach(brandName => {
      const b = brandMetrics.find(x => x.name === brandName)?.instagram;
      row.push({ text: b ? rowDef.fmt(b[rowDef.key]) : '-' });
    });
    table1.push(row);
  });

  // LinkedIn Data (3 rows)
  const liRows = [
    { label: 'Total Followers', key: 'followers', fmt: fmtStr },
    { label: 'Engagement Rate', key: 'engagementRate', fmt: () => '-' }, // LinkedIn doesn't have ER
    { label: 'Average Posting (3 Months)', key: 'postsAnalyzed', fmt: fmtStr }
  ];

  liRows.forEach((rowDef, i) => {
    let row = [];
    if (i === 0) {
      row.push({ text: 'LinkedIn', options: { ...platformColOpts, rowSpan: 3 } });
    }
    row.push({ text: rowDef.label, options: { align: 'center' } });
    allBrands.forEach(brandName => {
      const b = brandMetrics.find(x => x.name === brandName)?.linkedin;
      row.push({ text: b ? rowDef.fmt(b[rowDef.key]) : '-' });
    });
    table1.push(row);
  });

  slide1.addTable(table1, masterTableOpts);


  // ---------------------------------------------------------
  // SLIDE 2: Key Comparison (Facebook / YouTube)
  // ---------------------------------------------------------
  let slide2 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  slide2.addText('Key Comparison', { x: 0.5, y: 0.5, w: 5, fontSize: 28, bold: true, color: THEME.orange });

  let table2 = [];
  table2.push(headerRow1); // Same headers

  // Facebook Data (4 rows)
  const fbRows = [
    { label: 'Total Page Likes', key: 'followers', fmt: fmtStr },
    { label: 'Engagement Rate (%)', key: 'engagementRate', fmt: fmtRate },
    { label: 'Average Likes', key: 'avgLikes', fmt: fmtStr },
    { label: 'Average Comments', key: 'avgComments', fmt: fmtStr }
  ];

  fbRows.forEach((rowDef, i) => {
    let row = [];
    if (i === 0) {
      row.push({ text: 'Facebook', options: { ...platformColOpts, rowSpan: 4 } });
    }
    row.push({ text: rowDef.label, options: { align: 'center' } });
    allBrands.forEach(brandName => {
      const b = brandMetrics.find(x => x.name === brandName)?.facebook;
      if (b && b.hasPostData) {
        row.push({ text: rowDef.fmt(b[rowDef.key]) });
      } else if (b && i === 0) {
        row.push({ text: rowDef.fmt(b[rowDef.key]) });
      } else {
        row.push({ text: '-' });
      }
    });
    table2.push(row);
  });

  slide2.addTable(table2, masterTableOpts);


  // ---------------------------------------------------------
  // SLIDE 3: Brand Positioning Matrix
  // ---------------------------------------------------------
  if (analysisData?.brandPositioning) {
    let slide3 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
    
    let table3 = [];
    let headerRow3 = [
      { text: 'Category', options: { ...headerRowOpts, w: 2 } },
      ...allBrands.map(name => ({ text: name, options: { ...headerRowOpts, w: 7 / brandCount } }))
    ];
    table3.push(headerRow3);

    const bpRows = [
      { label: 'Core Communication Line', key: 'communicationLine' },
      { label: 'Tonality', key: 'tonality' },
      { label: 'Positioning', key: 'positioning' },
      { label: 'Communication Themes', key: 'communicationThemes' }
    ];

    bpRows.forEach(rowDef => {
      let row = [{ text: rowDef.label, options: { bold: true, color: THEME.orange } }];
      allBrands.forEach(brandName => {
        const b = analysisData.brandPositioning.find(x => x.brand.toLowerCase().includes(brandName.toLowerCase()));
        row.push({ text: b ? b[rowDef.key] : '-' });
      });
      table3.push(row);
    });

    slide3.addTable(table3, { ...masterTableOpts, y: 1.0 });
  }

  // ---------------------------------------------------------
  // SLIDES 4+: Platform Content & Themes Matrices
  // ---------------------------------------------------------
  const generatePlatformSlide = (platformName, aiPlatformData) => {
    if (!aiPlatformData || aiPlatformData.length === 0) return;
    
    let slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
    
    let table = [];
    let headerRow = [
      { text: 'Brand', options: { ...headerRowOpts, fill: { color: THEME.orange }, color: 'FFFFFF', w: 2 } },
      { text: 'Platform', options: { ...headerRowOpts, fill: { color: THEME.orange }, color: 'FFFFFF', w: 1.5 } },
      { text: 'Content Formats\n(Last 3 months)', options: { ...headerRowOpts, fill: { color: THEME.orange }, color: 'FFFFFF', w: 2.5 } },
      { text: 'Content Themes', options: { ...headerRowOpts, fill: { color: THEME.orange }, color: 'FFFFFF', w: 3 } }
    ];
    table.push(headerRow);

    allBrands.forEach((brandName, i) => {
      let row = [];
      row.push({ text: brandName, options: { bold: true } });
      
      if (i === 0) {
        row.push({ text: platformName, options: { rowSpan: brandCount } });
      }

      const aiData = aiPlatformData.find(x => x.brand.toLowerCase().includes(brandName.toLowerCase()));
      row.push({ text: aiData ? aiData.formats : '-' });
      row.push({ text: aiData ? aiData.themes : '-' });
      
      table.push(row);
    });

    slide.addTable(table, { ...masterTableOpts, y: 1.0 });
  };

  generatePlatformSlide('Instagram', analysisData?.platformStrategy?.instagram);
  generatePlatformSlide('Facebook', analysisData?.platformStrategy?.facebook);
  generatePlatformSlide('LinkedIn', analysisData?.platformStrategy?.linkedin);

  // Save the PPT
  await pptx.writeFile({ fileName: `${clientName.replace(/\\s+/g, '_')}_Competitor_Audit.pptx` });
}
