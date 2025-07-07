# Helper functions to process raw IMU data
import numpy as np
from typing import List, Dict, Any, Union

def compute_stddev(data: List[Dict[str, Any]]) -> List[float]:
    """
    Compute the standard deviation of x, y, z (resp. alpha, beta, gamma) 
    throughout the accel (resp. gyro) buffer

    Parameters:
        data: List of dicts, each containing:
            - 'ts': timestamp (ignored)
            - axis values (e.g., 'x', 'y', 'z' or 'alpha', 'beta', 'gamma')

    Returns:
        [std_x, std_y, std_z]
    """
    if not data:
        return [0.0, 0.0, 0.0]

    possible = ['x', 'y', 'z', 'alpha', 'beta', 'gamma']
    axes = [a for a in possible if a in data[0]]
    if len(axes) != 3:
        raise ValueError(f"Expected 3 axes, but found {axes!r}")

    columns = [ [reading[a] for reading in data] for a in axes ]

    arr = np.stack(columns, axis=1).astype(float)
    stds = arr.std(axis=0).tolist()
    return stds

def compute_range(data: List[Dict[str, Any]]) -> List[float]:
    """
    Compute the range (max - min) for each axis in the data list.

    Parameters:
        data: List of dicts, each containing:
            - 'ts': timestamp (ignored)
            - axis values (e.g., 'x', 'y', 'z' or 'alpha', 'beta', 'gamma')

    Returns:
        A list of ranges for each axis, in the order the axes appear in the first data point.
    """
    if not data:
        return []

    # Identify the axis keys (all keys except 'ts')
    axes = [k for k in data[0] if k != 'ts']

    min_vals = {axis: float('inf') for axis in axes}
    max_vals = {axis: float('-inf') for axis in axes}

    # Scan through data points to find mins and maxs
    for point in data:
        for axis in axes:
            val = point[axis]
            if val < min_vals[axis]:
                min_vals[axis] = val
            if val > max_vals[axis]:
                max_vals[axis] = val

    # Compute range for each axis
    return [max_vals[axis] - min_vals[axis] for axis in axes]

def compute_max_rate_of_change(data: List[Dict[str, Any]]) -> List[float]:
    """
    Compute the maximum absolute instantaneous rate of change for each axis.
    
    Parameters:
        data: List of dicts, each containing:
            - 'ts': timestamp in seconds (float)
            - axis values (e.g., 'x', 'y', 'z' or 'alpha', 'beta', 'gamma')
    
    Returns:
        A list of maximum absolute rates of change for each axis, in the 
        order the axes appear in the first data point.
    """
    # Edge case: not enough data to compute rate
    if len(data) < 2:
        axes = [k for k in data[0] if k != 'ts'] if data else []
        return [0.0] * len(axes)
    
    # Identify the axis keys (all keys except 'ts') and initialize max_rates
    axes = [k for k in data[0] if k != 'ts']
    max_rates = {axis: 0.0 for axis in axes}
    
    # Iterate over consecutive pairs
    for prev, curr in zip(data, data[1:]):
        dt = curr['ts'] - prev['ts']
        if dt <= 0:
            continue
        for axis in axes:
            rate = (curr[axis] - prev[axis]) / dt
            abs_rate = abs(rate)
            if abs_rate > max_rates[axis]:
                max_rates[axis] = abs_rate
    
    # Return the max rates in the same order as axes
    return [max_rates[axis] for axis in axes]

