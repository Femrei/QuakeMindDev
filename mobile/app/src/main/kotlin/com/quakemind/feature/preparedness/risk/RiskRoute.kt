package com.quakemind.feature.preparedness.risk

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.quakemind.feature.checklist.RiskScreen

@Composable
fun RiskRoute(
    onBack: () -> Unit,
    viewModel: RiskViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    RiskScreen(
        onBack = onBack,
        result = state.result,
        isLoading = state.isLoading,
        error = state.error,
        onAnalyze = viewModel::analyze,
    )
}
