"""URL module Tài chính (/api/v1/finance/...). Không có dấu `/` ở cuối; đường dẫn riêng đặt trước router."""

from django.urls import URLPattern, URLResolver, path
from rest_framework.routers import SimpleRouter

from app.finance.views.classification_rule_view_set import ClassificationRuleViewSet
from app.finance.views.income_export_view import IncomeExportView
from app.finance.views.income_recalculate_tax_view import IncomeRecalculateTaxView
from app.finance.views.income_reclassify_view import IncomeReclassifyView
from app.finance.views.income_refresh_rate_view import IncomeRefreshRateView
from app.finance.views.income_view_set import IncomeViewSet
from app.finance.views.invoice_view_set import InvoiceViewSet
from app.finance.views.platform_seed_view import PlatformSeedView
from app.finance.views.platform_tax_rate_resolve_view import PlatformTaxRateResolveView
from app.finance.views.platform_tax_rate_view import PlatformTaxRateObjectView, PlatformTaxRateView
from app.finance.views.platform_view_set import PlatformViewSet
from app.finance.views.report_monthly_view import ReportMonthlyView
from app.finance.views.report_summary_view import ReportSummaryView
from app.finance.views.rule_test_view import RuleTestView
from app.finance.views.sepay_connection_test_view import SepayConnectionTestView
from app.finance.views.sepay_connection_view import SepayConnectionView
from app.finance.views.sepay_import_view import SepayImportView
from app.finance.views.sepay_preview_view import SepayPreviewView
from app.finance.views.sepay_secret_rotate_view import SepaySecretRotateView
from app.finance.views.sepay_webhook_view import SepayWebhookView

app_name = "finance"

router = SimpleRouter(trailing_slash=False)
router.register("platforms", PlatformViewSet, basename="platforms")
router.register("rules", ClassificationRuleViewSet, basename="rules")
router.register("incomes", IncomeViewSet, basename="incomes")
router.register("invoices", InvoiceViewSet, basename="invoices")

urlpatterns: list[URLPattern | URLResolver] = [
    path("platforms/seed-defaults", PlatformSeedView.as_view(), name="platform-seed"),
    path(
        "platforms/<uuid:pk>/tax-rate", PlatformTaxRateResolveView.as_view(), name="platform-tax-rate-resolve"
    ),
    path("platforms/<uuid:pk>/tax-rates", PlatformTaxRateView.as_view(), name="platform-tax-rates"),
    path(
        "platforms/<uuid:pk>/tax-rates/<uuid:rate_id>",
        PlatformTaxRateObjectView.as_view(),
        name="platform-tax-rate",
    ),
    path("rules/test", RuleTestView.as_view(), name="rule-test"),
    path("incomes/export", IncomeExportView.as_view(), name="income-export"),
    path("incomes/reclassify", IncomeReclassifyView.as_view(), name="income-reclassify"),
    path("incomes/recalculate-tax", IncomeRecalculateTaxView.as_view(), name="income-recalculate-tax"),
    path("incomes/<uuid:pk>/refresh-rate", IncomeRefreshRateView.as_view(), name="income-refresh-rate"),
    path("reports/summary", ReportSummaryView.as_view(), name="report-summary"),
    path("reports/monthly", ReportMonthlyView.as_view(), name="report-monthly"),
    path("sepay/connection", SepayConnectionView.as_view(), name="sepay-connection"),
    path("sepay/connection/test", SepayConnectionTestView.as_view(), name="sepay-connection-test"),
    path("sepay/connection/rotate-secret", SepaySecretRotateView.as_view(), name="sepay-secret-rotate"),
    path("sepay/preview", SepayPreviewView.as_view(), name="sepay-preview"),
    path("sepay/import", SepayImportView.as_view(), name="sepay-import"),
    path("sepay/webhook/<str:public_id>", SepayWebhookView.as_view(), name="sepay-webhook"),
    *router.urls,
]
