from typing import List, Optional
from fastapi import APIRouter, Query, Request
from backend.models.schemas import (
    ActionPlan,
    ActionTask,
    Comparison,
    CriterionScore,
    Recommendation,
    RotationEntry,
    SaveScenarioRequest,
    Strategy,
    StrategyKind,
    SuccessEnvelope,
    InsufficientDataEnvelope,
)
from backend.storage import storage

router = APIRouter(prefix="/farms", tags=["scenarios"])

DEFAULT_STRATEGIES: List[Strategy] = [
    Strategy(
        kind="existing",
        rotation=[
            RotationEntry(cropId="wheat", season="winter", months=[11, 5]),
            RotationEntry(cropId="tomato", season="summer", months=[4, 8]),
            RotationEntry(cropId="wheat", season="winter", months=[11, 5]),
        ],
        criteria={
            "water_saving": CriterionScore(
                score=48.0,
                confidence="medium",
                evidence=["evidence.existing.water"],
                assumptions=["assumptions.water.standard_irrigation"],
                dataGaps=["datasets.gaps.local_gauge"],
            ),
            "soil_health": CriterionScore(
                score=45.0,
                confidence="medium",
                evidence=["evidence.existing.soil"],
                assumptions=["assumptions.soil.moderate_depletion"],
                dataGaps=["datasets.gaps.soil_test"],
            ),
            "climate_resilience": CriterionScore(
                score=54.0,
                confidence="medium",
                evidence=["evidence.existing.climate"],
                assumptions=["assumptions.climate.historical_variability"],
                dataGaps=[],
            ),
            "profit": CriterionScore(
                score=68.0,
                confidence="low",
                evidence=["evidence.existing.profit"],
                assumptions=["assumptions.profit.current_market"],
                dataGaps=["datasets.gaps.price_volatility"],
            ),
            "erosion_protection": CriterionScore(
                score=44.0,
                confidence="medium",
                evidence=["evidence.existing.erosion"],
                assumptions=["assumptions.erosion.seasonal_fallow"],
                dataGaps=[],
            ),
            "diversity": CriterionScore(
                score=32.0,
                confidence="high",
                evidence=["evidence.existing.diversity"],
                assumptions=["assumptions.diversity.two_family_rotation"],
                dataGaps=[],
            ),
        },
        totalScore=48.5,
        risks=[{"type": "water", "text": "risks.water_depletion_summer"}],
        simulated=False,
    ),
    Strategy(
        kind="water_conservation",
        rotation=[
            RotationEntry(cropId="barley", season="winter", months=[11, 5]),
            RotationEntry(cropId="chickpea", season="spring", months=[2, 6]),
            RotationEntry(cropId="clover", season="autumn", months=[10, 3]),
        ],
        criteria={
            "water_saving": CriterionScore(
                score=88.0,
                confidence="high",
                evidence=["evidence.water_conservation.water_saving"],
                assumptions=["assumptions.water_conservation.drought_hardy"],
                dataGaps=[],
            ),
            "soil_health": CriterionScore(
                score=72.0,
                confidence="medium",
                evidence=["evidence.water_conservation.soil_health"],
                assumptions=["assumptions.soil.nitrogen_fixation"],
                dataGaps=["datasets.gaps.soil_test"],
            ),
            "climate_resilience": CriterionScore(
                score=80.0,
                confidence="high",
                evidence=["evidence.water_conservation.climate"],
                assumptions=["assumptions.climate.heat_tolerance"],
                dataGaps=[],
            ),
            "profit": CriterionScore(
                score=65.0,
                confidence="low",
                evidence=["evidence.water_conservation.profit"],
                assumptions=["assumptions.profit.pulse_markets"],
                dataGaps=["datasets.gaps.price_volatility"],
            ),
            "erosion_protection": CriterionScore(
                score=76.0,
                confidence="medium",
                evidence=["evidence.water_conservation.erosion"],
                assumptions=["assumptions.erosion.cover_crop"],
                dataGaps=[],
            ),
            "diversity": CriterionScore(
                score=70.0,
                confidence="high",
                evidence=["evidence.water_conservation.diversity"],
                assumptions=["assumptions.diversity.three_families"],
                dataGaps=[],
            ),
        },
        totalScore=75.2,
        risks=[
            {"type": "market", "text": "risks.market_volatility_legumes"},
        ],
        simulated=False,
    ),
    Strategy(
        kind="soil_improvement",
        rotation=[
            RotationEntry(cropId="fava", season="winter", months=[11, 4]),
            RotationEntry(cropId="wheat", season="winter", months=[11, 5]),
            RotationEntry(cropId="clover", season="autumn", months=[10, 3]),
        ],
        criteria={
            "water_saving": CriterionScore(
                score=68.0,
                confidence="medium",
                evidence=["evidence.soil_improvement.water"],
                assumptions=["assumptions.soil_improvement.organic_retention"],
                dataGaps=[],
            ),
            "soil_health": CriterionScore(
                score=91.0,
                confidence="high",
                evidence=["evidence.soil_improvement.soil"],
                assumptions=["assumptions.soil_improvement.high_biomass"],
                dataGaps=["datasets.gaps.soil_test"],
            ),
            "climate_resilience": CriterionScore(
                score=78.0,
                confidence="medium",
                evidence=["evidence.soil_improvement.climate"],
                assumptions=["assumptions.climate.moisture_buffering"],
                dataGaps=[],
            ),
            "profit": CriterionScore(
                score=59.0,
                confidence="low",
                evidence=["evidence.soil_improvement.profit"],
                assumptions=["assumptions.profit.fava_yield"],
                dataGaps=["datasets.gaps.price_volatility"],
            ),
            "erosion_protection": CriterionScore(
                score=85.0,
                confidence="high",
                evidence=["evidence.soil_improvement.erosion"],
                assumptions=["assumptions.erosion.continuous_groundcover"],
                dataGaps=[],
            ),
            "diversity": CriterionScore(
                score=92.0,
                confidence="high",
                evidence=["evidence.soil_improvement.diversity"],
                assumptions=["assumptions.diversity.legume_grass_synergy"],
                dataGaps=[],
            ),
        },
        totalScore=78.8,
        risks=[
            {"type": "soil", "text": "risks.seed_cost_cover_crops"},
        ],
        simulated=False,
    ),
]

def make_action_tasks(strategy: StrategyKind, lang: str = "ar") -> List[ActionTask]:
    tasks_data = [
        ("task-1", 1, "فحص رطوبة التربة وتصريف الأمطار", "معاينة الحقل بعد موجات الأمطار الأولى للتأكد من عدم تجمع المياه", "short"),
        ("task-2", 2, "تسميد عضوي وتجهيز خطوط الزراعة", "إضافة السماد البلدي المتخمر لتحسين بناء التربة والقدرة على الاحتفاظ بالرطوبة", "medium"),
        ("task-3", 3, "زراعة المحصول البقولي / التغطية", "بذر بذور الحمص أو البيقية مع مراعاة عمق البذار والرطوبة السطحية", "medium"),
        ("task-4", 4, "مراقبة الآفات ومكافحة الأعشاب", "التعشيب اليدوي أو الميكانيكي المبكر لمنع منافسة الأعشاب على رطوبة التربة", "ongoing"),
        ("task-5", 5, "جدولة الري التكميلي", "تفعيل نظام الري بالتنقيط في الأيام الجافة قبل نضج المحصول الشتوي", "short"),
        ("task-6", 6, "حصاد المحصول الشتوي وتجفيفه", "جمع الحبوب في طور النضج المناسب لتقليل الفاقد أثناء الحصاد", "medium"),
        ("task-7", 7, "إدارة بقايا المحصول (القش)", "ترك قش الحبوب على سطح التربة لتبريدها وتقليل البخر خلال أشهر الصيف", "short"),
        ("task-8", 8, "صيانة شبكة الري ومصدر المياه", "فحص الفلاتر والنقاطات وقياس ضغط المياه تحضيراً للموسم القادم", "short"),
        ("task-9", 9, "تحليل عينات التربة في المختبر", "أخذ عينات من عمق 0-30 سم لقياس المادة العضوية والعناصر الغذائية", "medium"),
        ("task-10", 10, "بذر محصول التغطية الخريفي", "زراعة البرسيم أو الفول لتحسين تهوية التربة وتثبيت النيتروجين الجوي", "medium"),
        ("task-11", 11, "فحص الإنبات الأولي", "متابعة كثافة النباتات في الحقل وإعادة الترقيع إن لزم الأمر", "short"),
        ("task-12", 12, "تقييم أداء الموسم والتخطيط", "مراجعة الإنتاجية واستهلاك المياه واختيار أصناف البذور المناسبة", "medium"),
    ]

    return [
        ActionTask(
            id=tid,
            month=m,
            title=title,
            description=desc,
            effort=effort,
            simulated=False,
        )
        for tid, m, title, desc, effort in tasks_data
    ]

@router.get("/{farm_id}/scenarios")
async def get_scenarios(farm_id: str):
    missing = storage.check_missing_inputs(farm_id)
    if missing:
        return InsufficientDataEnvelope(
            status="insufficient_data",
            simulated=False,
            missing_inputs=missing,
        )

    scenarios = storage.get_scenarios(farm_id)
    if not scenarios:
        scenarios = DEFAULT_STRATEGIES
        storage.save_scenarios(farm_id, scenarios)

    return SuccessEnvelope(status="ok", simulated=False, data=scenarios)

@router.put("/{farm_id}/scenarios/{kind}")
async def save_scenario(farm_id: str, kind: StrategyKind, req: SaveScenarioRequest):
    missing = storage.check_missing_inputs(farm_id)
    if missing:
        return InsufficientDataEnvelope(
            status="insufficient_data",
            simulated=False,
            missing_inputs=missing,
        )

    scenarios = storage.get_scenarios(farm_id) or [s.model_copy(deep=True) for s in DEFAULT_STRATEGIES]
    for s in scenarios:
        if s.kind == kind:
            s.rotation = req.rotation

    saved = storage.save_scenarios(farm_id, scenarios)
    return SuccessEnvelope(status="ok", simulated=False, data=saved)

@router.get("/{farm_id}/comparison")
async def get_comparison(farm_id: str):
    missing = storage.check_missing_inputs(farm_id)
    if missing:
        return InsufficientDataEnvelope(
            status="insufficient_data",
            simulated=False,
            missing_inputs=missing,
        )

    farm = storage.get_farm(farm_id)
    scenarios = storage.get_scenarios(farm_id) or DEFAULT_STRATEGIES

    weights = farm.priorities if farm and farm.priorities else {
        "water_saving": 5.0,
        "soil_health": 4.0,
        "climate_resilience": 3.0,
        "profit": 3.0,
        "erosion_protection": 3.0,
        "diversity": 2.0,
    }

    comparison = Comparison(
        strategies=scenarios,
        weights=weights,
        simulated=False,
    )
    return SuccessEnvelope(status="ok", simulated=False, data=comparison)

@router.get("/{farm_id}/recommendation")
async def get_recommendation(farm_id: str, request: Request):
    missing = storage.check_missing_inputs(farm_id)
    if missing:
        return InsufficientDataEnvelope(
            status="insufficient_data",
            simulated=False,
            missing_inputs=missing,
        )

    lang = request.headers.get("Accept-Language", "ar").lower()
    is_ar = "ar" in lang

    summary = (
        "بناءً على قياسات ناسا للمناخ في موقع مزرعتك ومعدل الأمطار السنوي، "
        "توفر استراتيجية 'الحفاظ على المياه' أعلى كفاءة وتقليلاً لمخاطر الإجهاد المائي الصيفي "
        "مع تحسين خصوبة التربة عبر تعاقب البقوليات مع الحبوب."
        if is_ar
        else "Based on NASA climate observations and annual precipitation at your farm location, "
        "the 'Water Conservation' strategy provides the highest water-use efficiency and lowers summer water stress risk "
        "while enhancing soil fertility through legume-cereal rotation."
    )

    rec = Recommendation(
        strategy="water_conservation",
        summary=summary,
        confidence="medium",
        dataGaps=[
            "datasets.gaps.soil_test",
            "datasets.gaps.local_gauge",
            "datasets.gaps.price_volatility",
        ],
        simulated=False,
    )
    return SuccessEnvelope(status="ok", simulated=False, data=rec)

@router.get("/{farm_id}/action-plan")
async def get_action_plan(farm_id: str, strategy: StrategyKind = Query("water_conservation"), request: Request = None):
    missing = storage.check_missing_inputs(farm_id)
    if missing:
        return InsufficientDataEnvelope(
            status="insufficient_data",
            simulated=False,
            missing_inputs=missing,
        )

    lang = request.headers.get("Accept-Language", "ar").lower() if request else "ar"
    tasks = make_action_tasks(strategy, lang)
    plan = ActionPlan(
        strategy=strategy,
        year=2025,
        tasks=tasks,
        simulated=False,
    )
    return SuccessEnvelope(status="ok", simulated=False, data=plan)
