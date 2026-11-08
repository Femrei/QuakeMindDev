package com.quakemind.feature.home

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun HomeRoute(
    onMap: () -> Unit,
    onReport: () -> Unit,
    onSos: () -> Unit,
    onSafety: () -> Unit,
    onAlerts: () -> Unit,
    onRouting: () -> Unit,
    onDamage: () -> Unit,
    onNlp: () -> Unit,
    onRisk: () -> Unit,
    onChecklist: () -> Unit,
    onOperations: () -> Unit,
    onProfile: () -> Unit,
    onIncident: (String) -> Unit,
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    HomeScreen(
        state = state,
        onMap = onMap,
        onReport = onReport,
        onSos = onSos,
        onSafety = onSafety,
        onAlerts = onAlerts,
        onRouting = onRouting,
        onDamage = onDamage,
        onNlp = onNlp,
        onRisk = onRisk,
        onChecklist = onChecklist,
        onOperations = onOperations,
        onProfile = onProfile,
        onIncident = onIncident,
    )
}
