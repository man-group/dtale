# coding=utf-8
from enum import Enum
import numpy as np
import math
import scipy.stats as stats


class Component(Enum):
    """Enum containing the different Variance parts of GageRnR."""

    OPERATOR = 0
    PART = 1
    OPERATOR_BY_PART = 2
    MEASUREMENT = 3
    TOTAL = 4


ComponentNames = {
    Component.OPERATOR: "Operator",
    Component.PART: "Part",
    Component.OPERATOR_BY_PART: "Operator by Part",
    Component.MEASUREMENT: "Measurement",
    Component.TOTAL: "Total",
    "GageRnR": "Gage R&R",
}


class Result(Enum):
    """Enum containing the measurements calculated by GageRnR."""

    DF = 0
    Mean = 1
    SS = 3
    MS = 4
    Var = 5
    Std = 6
    F = 7
    P = 8
    W = 9
    K = 10
    Bias = 11


ResultNames = {
    Result.DF: "DF",
    Result.SS: "SS",
    Result.MS: "MS",
    Result.Var: "Var (σ²)",
    Result.Std: "Std (σ)",
    Result.F: "F-value",
    Result.P: "P-value",
}


class Statistics(object):

    title = "Statistics"

    def __init__(self, data, labels=None):
        self.data = data
        self.parts = data.shape[1]
        self.operators = data.shape[0]
        self.measurements = data.shape[2]
        if labels is None:
            self.labels = {}
        else:
            self.labels = labels

        if "Operator" not in self.labels:
            self.labels["Operator"] = [
                ("Operator %d" % x) for x in range(self.operators)
            ]

        if "Part" not in self.labels:
            self.labels["Part"] = [("Part %d" % x) for x in range(self.parts)]

    def calculate_mean(self):
        """Calculate Mean."""
        mu = np.array([np.mean(self.data)])

        omu = np.mean(self.data, axis=1)
        omu = np.mean(omu, axis=1)

        pmu = np.mean(self.data, axis=0)
        pmu = np.mean(pmu, axis=1)

        emu = np.mean(self.data, axis=2)
        emu = emu.reshape(self.parts * self.operators)

        return {
            Component.TOTAL: mu,
            Component.OPERATOR: omu,
            Component.PART: pmu,
            Component.MEASUREMENT: emu,
        }

    def calculate_std(self):
        std = np.array([np.std(self.data, ddof=1)])
        stdo = np.std(self.data_to_operators(), axis=1, ddof=1)
        stdp = np.std(self.data_to_parts(), axis=1, ddof=1)
        return {Component.TOTAL: std, Component.OPERATOR: stdo, Component.PART: stdp}

    def calculate(self):
        self.result = dict()
        self.result[Result.Mean] = self.calculate_mean()
        self.result[Result.Std] = self.calculate_std()

    def data_to_parts(self):
        data = np.transpose(self.data, axes=(1, 0, 2))
        return data.reshape(self.parts, self.measurements * self.operators)

    def data_to_operators(self):
        return self.data.reshape(self.operators, self.measurements * self.parts)


class GageRnR(Statistics):
    """Main class for calculating GageRnR."""

    GRR = "GageRnR"
    title = "Gage R&R"

    def __init__(self, data):
        """Initialize GageRnR algorithm.

        :param numpy.array data:
            The data tha we want to analyse using GageRnR.
            The input should be structured in a 3d array
            n[i,j,k] where i = operator, j = part, k = measurement
        """
        super(GageRnR, self).__init__(data)

    def calculate(self):
        """Calculate GageRnR."""
        self.result = dict()
        self.result[Result.DF] = self.calculate_dof()
        self.result[Result.Mean] = self.calculate_mean()
        self.result[Result.SS] = self.calculate_ss()

        self.result[Result.MS] = self.calculate_ms(
            self.result[Result.DF], self.result[Result.SS]
        )

        self.result[Result.Var] = self.calculate_var(self.result[Result.MS])

        self.result[Result.Std] = self.calculate_std(self.result[Result.Var])

        self.result[Result.F] = self.calculate_f(self.result[Result.MS])

        self.result[Result.P] = self.calculate_p(
            self.result[Result.DF], self.result[Result.F]
        )

        return self.result

    def calculate_dof(self):
        """Calculate Degrees of freedom."""
        oDoF = self.operators - 1
        pDoF = self.parts - 1
        opDoF = (self.parts - 1) * (self.operators - 1)
        eDof = self.parts * self.operators * (self.measurements - 1)
        totDof = self.parts * self.operators * self.measurements - 1
        return {
            Component.OPERATOR: oDoF,
            Component.PART: pDoF,
            Component.OPERATOR_BY_PART: opDoF,
            Component.MEASUREMENT: eDof,
            Component.TOTAL: totDof,
        }

    def calculate_squares(self):
        """Calculate Squares."""
        mean = self.calculate_mean()
        tS = (self.data - mean[Component.TOTAL]) ** 2
        oS = (mean[Component.OPERATOR] - mean[Component.TOTAL]) ** 2
        pS = (mean[Component.PART] - mean[Component.TOTAL]) ** 2

        dataE = self.data.reshape(self.operators * self.parts, self.measurements)
        meanMeas = np.repeat(mean[Component.MEASUREMENT], self.measurements)
        meanMeas = meanMeas.reshape(self.operators * self.parts, self.measurements)

        mS = (dataE - meanMeas) ** 2
        return {
            Component.TOTAL: tS,
            Component.OPERATOR: oS,
            Component.PART: pS,
            Component.MEASUREMENT: mS,
        }

    def calculate_sum_of_deviations(self):
        """Calculate Sum of Deviations."""
        squares = self.calculate_squares()
        SD = dict()
        for key in squares:
            SD[key] = np.sum(squares[key])
        return SD

    def calculate_ss(self):
        """Calculate Sum of Squares."""
        SS = self.calculate_sum_of_deviations()

        SS[Component.OPERATOR] = self.parts * self.measurements * SS[Component.OPERATOR]
        SS[Component.PART] = self.operators * self.measurements * SS[Component.PART]
        SS[Component.OPERATOR_BY_PART] = SS[Component.TOTAL] - (
            SS[Component.OPERATOR] + SS[Component.PART] + SS[Component.MEASUREMENT]
        )
        return SS

    def calculate_ms(self, dof, SS):
        """Calculate Mean of Squares."""
        MS = dict()

        for key in SS:
            MS[key] = SS[key] / dof[key]
        return MS

    def calculate_var(self, MS):
        """Calculate GageRnR Variances."""
        Var = dict()

        Var[Component.MEASUREMENT] = MS[Component.MEASUREMENT]
        Var[Component.OPERATOR_BY_PART] = (
            MS[Component.OPERATOR_BY_PART] - MS[Component.MEASUREMENT]
        ) / self.parts
        Var[Component.OPERATOR] = (
            MS[Component.OPERATOR] - MS[Component.OPERATOR_BY_PART]
        ) / (self.parts * self.measurements)
        Var[Component.PART] = (MS[Component.PART] - MS[Component.OPERATOR_BY_PART]) / (
            self.operators * self.measurements
        )

        for key in Var:
            if Var[key] < 0:
                Var[key] = 0

        Var[Component.TOTAL] = (
            Var[Component.OPERATOR]
            + Var[Component.PART]
            + Var[Component.OPERATOR_BY_PART]
            + Var[Component.MEASUREMENT]
        )

        Var[GageRnR.GRR] = (
            Var[Component.MEASUREMENT]
            + Var[Component.OPERATOR]
            + Var[Component.OPERATOR_BY_PART]
        )

        return Var

    def calculate_std(self, Var):
        """Calculate GageRnR Standard Deviations."""
        Std = dict()
        for key in Var:
            Std[key] = math.sqrt(Var[key])

        return Std

    def calculate_f(self, MS):
        """Calculate F-Values."""
        F = dict()

        F[Component.OPERATOR] = MS[Component.OPERATOR] / MS[Component.OPERATOR_BY_PART]

        F[Component.PART] = MS[Component.PART] / MS[Component.OPERATOR_BY_PART]

        F[Component.OPERATOR_BY_PART] = (
            MS[Component.OPERATOR_BY_PART] / MS[Component.MEASUREMENT]
        )

        return F

    def calculate_p(self, dof, F):
        """Calculate P-Values."""
        P = dict()

        P[Component.OPERATOR] = stats.f.sf(
            F[Component.OPERATOR],
            dof[Component.OPERATOR],
            dof[Component.OPERATOR_BY_PART],
        )

        P[Component.PART] = stats.f.sf(
            F[Component.PART], dof[Component.PART], dof[Component.OPERATOR_BY_PART]
        )

        P[Component.OPERATOR_BY_PART] = stats.f.sf(
            F[Component.OPERATOR_BY_PART],
            dof[Component.OPERATOR_BY_PART],
            dof[Component.MEASUREMENT],
        )
        return P
