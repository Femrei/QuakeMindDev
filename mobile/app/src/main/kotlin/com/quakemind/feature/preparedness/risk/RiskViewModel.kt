package com.quakemind.feature.preparedness.risk

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.quakemind.core.model.GeoPoint
import com.quakemind.core.network.api.RiskAssessmentService
import com.quakemind.core.network.api.RiskResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class RiskUiState(
    val isLoading: Boolean = false,
    val result: RiskResult? = null,
    val error: String? = null,
)

@HiltViewModel
class RiskViewModel @Inject constructor(private val riskService: RiskAssessmentService) : ViewModel() {
    private val _state = MutableStateFlow(RiskUiState())
    val state: StateFlow<RiskUiState> = _state.asStateFlow()

    fun analyze(latitude: String, longitude: String) {
        val lat = latitude.trim().replace(',', '.').toDoubleOrNull()
        val lon = longitude.trim().replace(',', '.').toDoubleOrNull()
        if (lat == null || lon == null || lat !in -90.0..90.0 || lon !in -180.0..180.0) {
            _state.update { it.copy(result = null, error = "Geçerli enlem ve boylam girin.") }
            return
        }
        if (_state.value.isLoading) return
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, result = null, error = null) }
            try {
                val result = riskService.regionalRisk(GeoPoint(lat, lon))
                _state.update { it.copy(isLoading = false, result = result) }
            } catch (cancel: CancellationException) {
                throw cancel
            } catch (_: Exception) {
                _state.update { it.copy(isLoading = false, error = "Bölgesel risk verisi alınamadı. Sunucu bağlantısını ve konumu kontrol edin.") }
            }
        }
    }
}
