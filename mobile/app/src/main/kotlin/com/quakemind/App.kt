package com.quakemind

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.quakemind.navigation.AppNavHost
import com.quakemind.navigation.components.SolidPureWhiteBottomNavBar
import com.quakemind.navigation.components.defaultBottomDestinations

@Composable
fun QuakeMindApp(
    navController: NavHostController = rememberNavController(),
) {
    val entry by navController.currentBackStackEntryAsState()
    val destination = entry?.destination
    val bottomItems = androidx.compose.runtime.remember { defaultBottomDestinations() }
    val showBottomBar = bottomItems.any { it.matches(destination) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
    ) {
        AppNavHost(
            navController = navController,
            modifier = Modifier.fillMaxSize(),
        )

        if (showBottomBar) {
            SolidPureWhiteBottomNavBar(
                items = bottomItems,
                destination = destination,
                onNavigate = { route ->
                    navController.navigate(route) {
                        popUpTo(com.quakemind.navigation.HomeRoute) { saveState = true }
                        launchSingleTop = true
                        restoreState = true
                    }
                },
                modifier = Modifier.align(Alignment.BottomCenter),
            )
        }
    }
}
