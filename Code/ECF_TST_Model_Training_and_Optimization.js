/**
 * =================================================================================
 * ECF-TST Framework: Ecoregion-Specific Random Forest Model Training & Optimization
 * =================================================================================
 * 
 * Purpose: This script performs automated hyperparameter tuning and training of a
 * Random Forest classifier for Forest Cover Loss (FCL) detection within a SINGLE
 * ecoregion, as part of the Ecoregion-Constrained Feature and Temporal-Spatial
 * Trajectory (ECF-TST) framework.
 * 
 * Corresponding Manuscript Section: 2.3.2 "Ecoregion-Specific Model Training,
 * Optimization, and FCL Mapping"
 * 
 * Workflow:
 * 1. Loads the pre-defined optimal feature subset for the target ecoregion.
 * 2. Loads the validated sample points (FCL & Stable) for the ecoregion.
 * 3. Applies stratified random split to create training/testing sets.
 * 4. Conducts a grid search over hyperparameters (class target sizes, RF params).
 * 5. Trains a Random Forest model for each combination and evaluates performance.
 * 6. Exports evaluation metrics to Google Drive for selecting the optimal model.
 * 
 * Key Notes:
 * - The optimal feature subset (`optimalFeatures*`) is the result of a separate
 *   Recursive Feature Elimination (RFE) process (see manuscript).
 * - Sample points are derived from the Hansen Global Forest Change v1.12 dataset
 *   (2000-2024) and rigorously validated via LandTrendr trajectories and
 *   high-resolution imagery (Section 2.2.1).
 * - The final, best-performing model for each ecoregion is saved as a GEE Asset
 *   (e.g., `RF2_Optimized_Model_E1`) and used in the prediction script.
 * 
 * Data Sources Cited:
 * - Forest Cover Loss Reference: Hansen/UMD/Google/USGS/NASA (2013).
 * - Sample Validation: LandTrendr (Kennedy et al., 2010), Google Earth, Bing Maps.
 * 
 * =================================================================================
 */

// -------------------------------
// 1. ECOREGION CONFIGURATION
// -------------------------------
// USER MUST SET THIS VARIABLE
var ECO_ZONE_ID = 1; // Set target ecoregion ID (1 to 35).

print('===================================');
print('ECF-TST Model Training');
print('Target Ecoregion ID:', ECO_ZONE_ID);
print('===================================');

// -------------------------------
// 2. LOAD ECOREGION-SPECIFIC ASSETS
// -------------------------------

// 2.1 Load the pre-optimized feature subset for this ecoregion.
// These lists are the result of the RFE process described in the manuscript.
var optimalFeatures1 = ee.List(['NBR', 'NBR_chg_ra', 'NBR_rol_3y']);
var optimalFeatures2 = ee.List(['NBR_chg_ra', 'NBR', 'NDMI', 'NBR_rol_3y']);
var optimalFeatures3 = ee.List(['NBR', 'NDMI', 'NBR_rol_3y', 'NDBI', 'NBR_rol_5y', 'RVI', 'NDMI_rol_5', 'SAVI', 'NBR_chg_ra']);
var optimalFeatures4 = ee.List(['NBR', 'NBR_rol_3y', 'NDMI', 'NBR_rol_5y', 'NDBI', 'NDMI_chg_r', 'NDBI_chg_r', 'NBR_chg_ra', 'NDMI_rol_3', 'NDBI_rol_3']);
var optimalFeatures5 = ee.List(['NBR', 'NDBI', 'NBR_rol_5y', 'NDMI', 'NDMI_rol_5', 'NDMI_rol_3', 'NBR_rol_3y', 'NBR_chg_ra']);
var optimalFeatures6 = ee.List(['NBR_chg_ra', 'NBR', 'NBR_rol_3y']);
var optimalFeatures7 = ee.List(['NDMI', 'NBR', 'NDBI', 'NBR_rol_3y', 'NBR_rol_5y', 'NDMI_rol_3', 'NDMI_rol_5', 'NDBI_rol_3', 'NBR_chg_ac', 'NBR_chg_ra', 'EVI']);
var optimalFeatures8 = ee.List(['NBR', 'NBR_rol_5y', 'NDMI', 'NBR_rol_3y', 'NBR_chg_ra']);
var optimalFeatures9 = ee.List(['NBR', 'NBR_rol_3y', 'NBR_rol_5y']);
var optimalFeatures10 = ee.List(['NBR', 'NDMI', 'NDBI', 'NBR_chg_ra', 'NBR_trend', 'NBR_rol_5y', 'EVI_mean']);
var optimalFeatures11 = ee.List(['NBR', 'NBR_rol_5y', 'NDMI', 'NDBI', 'NBR_rol_3y', 'NDMI_rol_5', 'NDBI_rol_3']);
var optimalFeatures12 = ee.List(['NBR', 'NBR_rol_5y', 'NDMI_rol_5', 'NDMI']);
var optimalFeatures13 = ee.List(['NBR_rol_5y', 'NBR', 'NDMI', 'NDBI', 'NBR_chg_ra', 'NBR_rol_3y']);
var optimalFeatures14 = ee.List(['NBR', 'NBR_rol_3y', 'NDBI', 'NBR_rol_5y']);
var optimalFeatures15 = ee.List(['NBR_rol_5y', 'NBR', 'NDMI', 'NBR_vola_5', 'NBR_rol_3y', 'NDBI', 'NBR_chg_ra']);
var optimalFeatures16 = ee.List(['NBR', 'NBR_rol_3y', 'NBR_rol_5y', 'NDMI', 'NDBI', 'NBR_trend', 'NDMI_rol_5']);
var optimalFeatures17 = ee.List(['NBR', 'NBR_rol_5y', 'NDBI', 'NDMI', 'NBR_chg_ra', 'NDMI_rol_5', 'NBR_rol_3y']);
var optimalFeatures18 = ee.List(['NBR', 'NBR_rol_5y', 'NDBI', 'NDMI', 'NBR_rol_3y', 'NBR_chg_ra']);
var optimalFeatures19 = ee.List(['NBR', 'NDBI', 'NBR_rol_5y']);
var optimalFeatures20 = ee.List(['NBR', 'NDMI', 'NBR_rol_5y', 'NDBI', 'NBR_rol_3y', 'NDMI_rol_5', 'RVI_rol_5y', 'NDBI_rol_3', 'NDVI_rol_3', 'NBR_chg_ra', 'NBR_an_cha']);
var optimalFeatures21 = ee.List(['NBR', 'NBR_rol_3y', 'NDBI', 'NDMI', 'NBR_rol_5y', 'NDBI_rol_3', 'NDMI_rol_3', 'NDMI_rol_5', 'EVI', 'NBR_chg_ra']);
var optimalFeatures22 = ee.List(['NBR', 'NDMI', 'NDBI', 'NBR_chg_ra', 'NBR_rol_3y']);
var optimalFeatures23 = ee.List(['NBR', 'NBR_rol_5y', 'NBR_rol_3y', 'NDMI', 'NDBI', 'NDMI_rol_5', 'NBR_chg_ra', 'SAVI_rol_3']);
var optimalFeatures24 = ee.List(['NBR', 'NBR_rol_5y', 'NDBI', 'NDMI', 'NBR_rol_3y', 'NBR_chg_ra', 'NDVI']);
var optimalFeatures25 = ee.List(['NBR', 'NDBI', 'NBR_rol_3y', 'NDMI', 'NBR_rol_5y', 'NBR_chg_ra']);
var optimalFeatures26 = ee.List(['NBR', 'NDBI', 'NBR_rol_3y', 'NDMI', 'NBR_trend']);
var optimalFeatures27 = ee.List(['NBR', 'NBR_rol_5y', 'NDMI', 'NDBI', 'NBR_chg_ra', 'NBR_rol_3y']);
var optimalFeatures28 = ee.List(['NBR_rol_3y', 'NBR', 'NDBI', 'NDMI', 'NBR_rol_5y', 'NBR_chg_ra']);
var optimalFeatures29 = ee.List(['NBR', 'NDBI', 'NDMI', 'NBR_rol_3y', 'NDVI_rol_3', 'SAVI_rol_3', 'NBR_rol_5y', 'NDMI_rol_5', 'RVI', 'NDBI_rol_3', 'NBR_an_cha', 'NBR_reco_s', 'NDMI_rol_3', 'NDVI', 'NBR_chg_ra']);
var optimalFeatures30 = ee.List(['NBR', 'NDMI', 'NBR_rol_3y', 'NDVI_rol_3', 'NDBI', 'NBR_rol_5y', 'NBR_chg_ra']);
var optimalFeatures31 = ee.List(['NBR_chg_ra', 'NBR', 'NDMI', 'NBR_rol_3y', 'NDBI', 'NDMI_rol_3', 'NDBI_rol_3', 'NBR_trend', 'NDVI']);
var optimalFeatures32 = ee.List(['NDBI', 'NDMI', 'NBR', 'NDMI_rol_3', 'NBR_rol_3y', 'NBR_chg_ra', 'NDBI_rol_3', 'NBR_rol_5y', 'NDBI_chg_r', 'NDMI_rol_5', 'NDMI_chg_r', 'NBR_an_cha']);
var optimalFeatures33 = ee.List(['NBR', 'NDBI', 'NDMI', 'NBR_chg_ra', 'NDMI_rol_5', 'NBR_trend', 'NBR_rol_5y']);
var optimalFeatures34 = ee.List(['NBR', 'NBR_chg_ra', 'NDMI', 'NBR_rol_5y', 'NDMI_rol_5', 'NDBI', 'NBR_rol_3y']);
var optimalFeatures35 = ee.List(['NBR', 'NBR_chg_ra', 'NBR_rol_3y']);

// Dynamically select the correct feature list.
var optimalFeatures = ee.List(eval('optimalFeatures' + ECO_ZONE_ID));

// 2.2 Load the validated sample points for this ecoregion.
// These collections contain the 'label' property (0:Stable, 1-3:FCL sub-types)
// and all feature values extracted at sample locations.
var sampledPoints1 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E1");
var sampledPoints2 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E2");
var sampledPoints3 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E3");
var sampledPoints4 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E4");
var sampledPoints5 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E5");
var sampledPoints6 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E6");
var sampledPoints7 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E7");
var sampledPoints8 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E8");
var sampledPoints9 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E9");
var sampledPoints10 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E10");
var sampledPoints11 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E11");
var sampledPoints12 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E12");
var sampledPoints13 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E13");
var sampledPoints14 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E14");
var sampledPoints15 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E15");
var sampledPoints16 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E16");
var sampledPoints17 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E17");
var sampledPoints18 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E18");
var sampledPoints19 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E19");
var sampledPoints20 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E20");
var sampledPoints21 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E21");
var sampledPoints22 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E22");
var sampledPoints23 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E23");
var sampledPoints24 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E24");
var sampledPoints25 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E25");
var sampledPoints26 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E26");
var sampledPoints27 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E27");
var sampledPoints28 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E28");
var sampledPoints29 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E29");
var sampledPoints30 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E30");
var sampledPoints31 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E31");
var sampledPoints32 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E32");
var sampledPoints33 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E33");
var sampledPoints34 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E34");
var sampledPoints35 = ee.FeatureCollection("projects/polished-autumn-296103/assets/E35");

var sampledPoints = ee.FeatureCollection(eval('sampledPoints' + ECO_ZONE_ID));

print('Loaded optimal feature subset:', optimalFeatures);
print('Number of sample points:', sampledPoints.size());

// -------------------------------
// 3. HYPERPARAMETER GRID DEFINITION
// -------------------------------

// 3.1 Target class sizes for oversampling (to handle class imbalance).
// Format: [Target_Class1, Target_Class2, Target_Class3]
var targetSizesGrid = ee.List([
  [400, 400, 600],
  [400, 400, 800],
  [400, 500, 700],
  [500, 400, 700],
  [500, 500, 600],
  [500, 500, 700],
  [500, 500, 800],
  [600, 400, 700],
  [600, 500, 800]
]);

// 3.2 Random Forest algorithm parameters.
var rfParamsGrid = ee.List([
  {trees: 50, leafPop: 1, bagFrac: 0.5, splitVar: 0.5},
  {trees: 50, leafPop: 1, bagFrac: 0.7, splitVar: 0.7},
  {trees: 50, leafPop: 2, bagFrac: 0.6, splitVar: 0.6},
  {trees: 100, leafPop: 1, bagFrac: 0.5, splitVar: 0.7},
  {trees: 100, leafPop: 2, bagFrac: 0.6, splitVar: 0.6},
  {trees: 100, leafPop: 5, bagFrac: 0.7, splitVar: 0.5},
  {trees: 150, leafPop: 2, bagFrac: 0.7, splitVar: 0.5},
  {trees: 150, leafPop: 5, bagFrac: 0.5, splitVar: 0.7},
  {trees: 200, leafPop: 5, bagFrac: 0.6, splitVar: 0.6}
]);

// 3.3 Create the full Cartesian product of all parameter combinations.
var allCombinations = targetSizesGrid.map(function(targetSizes) {
  return rfParamsGrid.map(function(rfParams) {
    return ee.Dictionary({
      targetSizes: ee.List(targetSizes),
      rfParams: ee.Dictionary(rfParams)
    });
  });
}).flatten();

print('Total parameter combinations to evaluate:', allCombinations.size());

// -------------------------------
// 4. HELPER FUNCTIONS
// -------------------------------

/**
 * Converts feature property strings to numbers for model ingestion.
 * @param {ee.Feature} feature - Input feature with string properties.
 * @returns {ee.Feature} Feature with numeric properties.
 */
var convertToFloat = function(feature) {
  var safeParse = function(prop) {
    var val = feature.get(prop);
    var strVal = ee.String(val);
    var isEmpty = strVal.length().eq(0);
    return ee.Algorithms.If(
      isEmpty,
      0,
      ee.Number.parse(strVal)
    );
  };

  var converted = {};
  var featureNames = optimalFeatures.getInfo(); // Requires getInfo for mapping
  featureNames.forEach(function(prop) {
    converted[prop] = safeParse(prop);
  });
  var label = ee.Number(safeParse('label')).toInt();
  
  return feature
    .set(converted)
    .set('label', label);
};

/**
 * Performs oversampling for a specific class to reach a target size.
 * @param {ee.FeatureCollection} features - Full training set.
 * @param {Number} targetClass - The class label to oversample.
 * @param {ee.Number} multiplier - Oversampling multiplier.
 * @returns {ee.FeatureCollection} Oversampled collection for the class.
 */
function oversampleClass(features, targetClass, multiplier) {
  var classSamples = features.filter(ee.Filter.eq('label', targetClass));
  var size = classSamples.size();
  var targetSize = ee.Number(multiplier).multiply(size).max(0).round();
  var overSize = targetSize.subtract(size);
  
  var overSampled = ee.Algorithms.If(
    overSize.gt(0),
    classSamples.randomColumn('oversample').limit(overSize, 'oversample', true),
    ee.FeatureCollection([])
  );
  return classSamples.merge(overSampled);
}

// -------------------------------
// 5. PARAMETER EVALUATION FUNCTION
// -------------------------------

/**
 * Evaluates one hyperparameter combination.
 * @param {ee.Dictionary} combination - Contains targetSizes and rfParams.
 * @param {ee.Number} iteration - Index of the combination.
 * @returns {ee.Feature} A feature with evaluation metrics as properties.
 */
var evaluateParams = function(combination, iteration) {
  combination = ee.Dictionary(combination);
  var targetSizes = ee.List(combination.get('targetSizes'));
  var rfParams = ee.Dictionary(combination.get('rfParams'));
  
  // 5.1 Data Preprocessing & Split
  var completeSamples = sampledPoints
    .filter(ee.Filter.notNull(optimalFeatures))
    .map(convertToFloat)
    .filter(ee.Filter.neq('NBR', 0)); // Basic quality filter
  
  var split = 0.75; // 75% training, 25% testing
  var withRandom = completeSamples.randomColumn('random', ee.Number(iteration).add(100));
  var trainingOriginal = withRandom.filter(ee.Filter.lt('random', split));
  var testingSet = withRandom.filter(ee.Filter.gte('random', split));
  
  // 5.2 Class Balancing via Oversampling
  var classSizes = trainingOriginal.reduceColumns({
    reducer: ee.Reducer.frequencyHistogram(),
    selectors: ['label']
  }).get('histogram');
  var classSizesDict = ee.Dictionary(classSizes);
  
  var class1Target = targetSizes.getNumber(0);
  var class2Target = targetSizes.getNumber(1);
  var class3Target = targetSizes.getNumber(2);
  
  var class1Multiplier = class1Target.divide(classSizesDict.getNumber('1'));
  var class2Multiplier = class2Target.divide(classSizesDict.getNumber('2'));
  var class3Multiplier = class3Target.divide(classSizesDict.getNumber('3'));
  
  var oversampledClass1 = oversampleClass(trainingOriginal, 1, class1Multiplier);
  var oversampledClass2 = oversampleClass(trainingOriginal, 2, class2Multiplier);
  var oversampledClass3 = oversampledClass(trainingOriginal, 3, class3Multiplier);
  
  var balancedTrainingSet = trainingOriginal
    .filter(ee.Filter.eq('label', 0))
    .merge(oversampledClass1)
    .merge(oversampledClass2)
    .merge(oversampledClass3);
  
  // 5.3 Classifier Configuration & Training
  var numFeatures = optimalFeatures.size();
  var splitVarFactor = rfParams.getNumber('splitVar');
  var splitVars = numFeatures.multiply(splitVarFactor).sqrt().int();
  
  var classifier = ee.Classifier.smileRandomForest({
    numberOfTrees: rfParams.getNumber('trees'),
    minLeafPopulation: rfParams.getNumber('leafPop'),
    variablesPerSplit: splitVars,
    bagFraction: rfParams.getNumber('bagFrac')
  });
  
  var trainedClassifier = classifier.train({
    features: balancedTrainingSet,
    classProperty: 'label',
    inputProperties: optimalFeatures
  });
  
  // 5.4 Model Evaluation
  var testFeatures = testingSet.select(optimalFeatures.add('label'));
  var testClassification = testFeatures.classify(trainedClassifier);
  var confusionMatrix = testClassification.errorMatrix('label', 'classification');
  
  // 5.5 Compile Results
  var stats = ee.Dictionary({
    'eco_zone': ECO_ZONE_ID,
    'iteration': iteration,
    'class1_target': class1Target,
    'class2_target': class2Target,
    'class3_target': class3Target,
    'num_trees': rfParams.getNumber('trees'),
    'min_leaf_pop': rfParams.getNumber('leafPop'),
    'bag_frac': rfParams.getNumber('bagFrac'),
    'split_vars': splitVars,
    'overall_accuracy': confusionMatrix.accuracy(),
    'kappa': confusionMatrix.kappa(),
    'recall_0': ee.Number(confusionMatrix.producersAccuracy().toList().get(0)),
    'recall_1': ee.Number(confusionMatrix.producersAccuracy().toList().get(1)),
    'recall_2': ee.Number(confusionMatrix.producersAccuracy().toList().get(2)),
    'recall_3': ee.Number(confusionMatrix.producersAccuracy().toList().get(3)),
  });
  
  return ee.Feature(null, stats);
};

// -------------------------------
// 6. EXECUTE GRID SEARCH & EXPORT
// -------------------------------

print('Starting grid search evaluation...');
var sequence = ee.List.sequence(0, allCombinations.size().subtract(1));
var results = ee.FeatureCollection(
  sequence.map(function(iteration) {
    iteration = ee.Number(iteration);
    var combination = allCombinations.get(iteration);
    return evaluateParams(combination, iteration);
  })
);

print('Parameter optimization results sample:', results.limit(5));

// Export the full results table for analysis.
Export.table.toDrive({
  collection: results,
  description: 'Full_Hyperparam_Optimization_E' + ECO_ZONE_ID,
  fileFormat: 'CSV',
  folder: 'GEE_Exports',
  selectors: [
    'eco_zone', 'iteration', 
    'class1_target', 'class2_target', 'class3_target',
    'num_trees', 'min_leaf_pop', 'bag_frac', 'split_vars',
    'overall_accuracy', 'kappa',
    'recall_0', 'recall_1', 'recall_2', 'recall_3'
  ]
});

print('===================================');
print('Export task initiated.');
print('Check the "Tasks" tab to run the export to Google Drive.');
print('===================================');
