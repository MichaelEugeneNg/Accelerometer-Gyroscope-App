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
        return [0.0, 0.0, 0.0]

    # Identify the axis keys (all keys except 'ts')
    axes = [k for k in data[0] if k != 'ts']

    min_vals = {axis: float('inf') for axis in axes}
    max_vals = {axis: float('-inf') for axis in axes}

    # Scan through data points to find mins and maxs
    for point in data:
        for axis in axes:
            val = point[axis]
            if val:
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
            v0 = prev.get(axis)
            v1 = curr.get(axis)
            # skip if missing or None
            if v0 is None or v1 is None:
                continue
            rate = (v1 - v0) / dt
            abs_rate = abs(rate)
            if abs_rate > max_rates[axis]:
                max_rates[axis] = abs_rate
    
    # Return the max rates in the same order as axes
    return [max_rates[axis] for axis in axes]

def compute_max_jerk(data: List[Dict[str, Any]]) -> List[float]:
    """
    Compute the maximum absolute jerk/rotational jerk along each axis.
    For accelerometer data (axes x,y,z) we compute the first derivative of acceleration (jerk).
    For gyroscope data (axes alpha,beta,gamma) we compute the second derivative of angular velocity
    (rotational jerk = d²(omega)/dt²).
    Duplicate timestamps (due to rounding) are collapsed to avoid zero-Δt.

    Parameters:
        data: List of dicts, each containing:
            - 'ts': timestamp in seconds (float)
            - axis values (e.g., 'x','y','z' or 'alpha','beta','gamma')

    Returns:
        A list of max abs jerk/rotational jerk for each axis in the order axes appear in first sample.
    """
    if not data or len(data) < 3:
        return []

    # Extract and sort by timestamp
    ts = np.array([d['ts'] for d in data])
    axes = [k for k in data[0].keys() if k != 'ts']
    order = np.argsort(ts)
    ts = ts[order]
    vals = {ax: np.array([data[i][ax] for i in order]) for ax in axes}

    # Remove duplicate timestamps (keep first)
    uniq_ts, idx = np.unique(ts, return_index=True)
    ts = uniq_ts
    vals = {ax: v[idx] for ax, v in vals.items()}

    # Compute Δt (guaranteed to be more than 0, thereby preventing NaNs)
    dt = np.diff(ts)

    max_jerks = []
    is_gyro = set(axes) & {'alpha','beta','gamma'}
    for ax in axes:
        series = vals[ax]
        if ax in is_gyro:
            # rotational jerk = second derivative of angular velocity
            # first derivative: angular acceleration
            ang_acc = np.diff(series) / dt
            # second derivative: rotational jerk
            rot_jerk = np.diff(ang_acc) / dt[1:]
            jerk_vals = np.abs(rot_jerk)
        else:
            # linear jerk = derivative of linear acceleration
            jerk = np.diff(series) / dt  # change in accel per dt
            jerk_vals = np.abs(jerk)

        max_jerks.append(float(jerk_vals.max()) if jerk_vals.size else 0.0)

    return max_jerks

def compute_motion_cadence(data: List[Dict[str, Any]]) -> List[float]:
    """
    Compute motion cadence (zero-crossings per second) along each axis.
    
    Parameters:
        data: List of dicts, each containing:
            - 'ts': timestamp in seconds (float)
            - axis values (e.g., 'x', 'y', 'z' or 'alpha', 'beta', 'gamma')
    
    Returns:
        A list of motion cadences (in Hz) for each axis,
        in the order the axes appear in the first data point.
    """
    if not data or len(data) < 2:
        return [0.0, 0.0, 0.0]

    # Extract timestamps and axis names
    ts = np.array([d['ts'] for d in data])
    axes = [k for k in data[0].keys() if k != 'ts']
    
    # Sort by timestamp
    order = np.argsort(ts)
    ts = ts[order]
    values = {axis: np.array([data[i][axis] for i in order]) for axis in axes}

    # Remove duplicate timestamps (keep first)
    uniq_ts, idx = np.unique(ts, return_index=True)
    ts = uniq_ts
    values = {axis: v[idx] for axis, v in values.items()}

    # Total duration
    duration = ts[-1] - ts[0]
    if duration <= 0:
        return [0.0] * len(axes)

    # Compute zero-crossings for each axis
    cadences = []
    for axis in axes:
        sig = values[axis]
        # identify zero crossings
        zero_crossings = np.where(np.diff(np.sign(sig)) != 0)[0]
        cadence = len(zero_crossings) / duration
        cadences.append(float(cadence))

    return cadences
