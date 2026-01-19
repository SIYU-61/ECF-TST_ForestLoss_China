ECF-TST_ForestLoss_China
📖 项目概述
此存储库包含完整代码和数据，用于复现论文 "利用生态区约束特征和时空轨迹框架(ECF-TST)绘制中国森林覆盖损失图(2000-2024)" 中的分析。

本研究开发了生态区约束特征和时空轨迹(ECF-TST)框架，以30米分辨率绘制2000年至2024年中国年度森林覆盖损失(FCL)图。为应对显著的空间异质性，我们：

将中国划分为35个生态区

为每个生态区构建多维度特征集(光谱、时序、纹理、气候、地形、社会经济)

为每个生态区独立训练和优化随机森林分类器

应用概率阈值化和空间后处理生成稳健的年度FCL图


📁 仓库结构
text
ECF-TST_ForestLoss_China/
│
├── README.md                           # 项目说明文档
├── LICENSE                             # MIT许可证
├── requirements.txt                    # Python环境依赖
│
├── code/                               # 所有分析代码
│   ├── 1_Model_Training_and_Optimization.js
│   ├── 2_Annual_FCL_Mapping.js
│   ├── Figure_1_Spectral_Trajectories.ipynb
│   ├── Figure_4_Model_Performance_Improvement.ipynb
│   ├── Figure_5_Single_Feature_Performance.ipynb
│   ├── Figure_6_Feature_Synergy_Analysis.ipynb
│   ├── Figure_7_SHAP_Explainability.ipynb
│   ├── Figure_8_Spatiotemporal_Patterns.ipynb
│   ├── Figure_9_Temporal_Dynamics.ipynb
│   ├── Figure_10_Driving_Mechanisms.ipynb
│   └── Figure_11_Nonlinear_Responses.ipynb
│
├── data/                               # 所有相关数据
│   ├── 样本点数据/                   # 样本数据
│   │   ├── eco_region_36_all_years.csv
│   │   ├── bandcombin2.csv
│   │   ├── forest_loss_analysis_results.csv
│   │   └── 111.csv
│   ├── ecoregion_data/                 # 生态区数据
│   │   ├── EcoRegion_Info.csv
│   │   └── ecoregion_shapefiles/      # 生态区矢量文件
│   │       ├── 省.shp
│   │       ├── 市.shp
│   │       └── 县.shp
│   ├── modeling_data/                  # 建模数据
│   │   ├── feature_matrices/
│   │   ├── trained_models/
│   │   └── performance_metrics/
│   └── README.md                       # 数据说明文档
│
└── figures/                            # 所有可视化图表
    ├── manuscript_figures/             # 论文正式图表
    │   ├── figure1/
    │   ├── figure2/
    │   ├── figure3/
    │   ├── figure4/
    │   ├── figure5/
    │   ├── figure6/
    │   ├── figure7/
    │   ├── figure8/
    │   ├── figure9/
    │   ├── figure10/
    │   ├── figure11/
    │   └── 2000-2024年中国年度森林覆盖损失图/
    └── README.md                       # 图表说明文档

    
📊 数据可用性
Landsat时间序列数据来源于Google Earth Engine平台 (https://developers.google.com/earth-engine/datasets/catalog/landsat)

Landsat轨迹分析使用UI LandTrendr Pixel Time Series Plotter进行 (https://emaprlab.users.earthengine.app/view/lt-gee-pixel-time-series)

高分辨率影像通过Google Earth (https://earth.google.com/)和Bing Maps (https://www.bing.com/)访问

全球森林变化数据来源于Hansen Global Forest Change v1.12 (2024)数据集 (https://developers.google.com/earth-engine/datasets/catalog/UMD_hansen_global_forest_change_2024_v1_12)

中国生态区数据来源于中国生态系统评估与生态安全数据库 (https://www.ecosystem.csdb.cn/ecoass/ecoplanningzone_tree.jsp)

基准森林覆盖数据由CASEarth专题数据系统提供 (https://data.casearth.cn/thematic/glc_fcs30)

地形数据(SRTM 90m DEM)通过Google Earth Engine访问 (https://developers.google.com/earth-engine/datasets/catalog/CGIAR_SRTM90_V4)

气候数据来源于ERA5-Land月度聚合数据集 (https://developers.google.com/earth-engine/datasets/catalog/ECMWF_ERA5_LAND_MONTHLY_AGGR)

社会经济数据包括空间网格化人口 (https://www.resdc.cn/doi/doi.aspx?DOIid=32)和GDP (https://www.resdc.cn/DOI/DOI.aspx?DOIID=33)数据，来源于资源环境科学数据平台(RESDC)

中国年度森林覆盖损失图(2000-2024)通过Figshare公开获取 (DOI: 10.6084/m9.figshare.30656924)
